import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  generatePortrait,
  PORTRAIT_STYLE_OPTIONS,
} from "@/lib/ai/generate-portrait";
import type { PortraitStyle } from "@/lib/ai/generate-portrait";
import { z } from "zod";

export const dynamic = "force-dynamic";

// Body max ~4MB (base64 fotoğraf)
export const maxDuration = 60;

const validStyles = PORTRAIT_STYLE_OPTIONS.map((s) => s.value) as [
  string,
  ...string[],
];

const requestSchema = z.object({
  imageBase64: z
    .string()
    .min(100, "Fotoğraf verisi çok küçük")
    .max(6_000_000, "Fotoğraf 4MB'dan büyük olamaz"),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  style: z.enum(validStyles),
});

/**
 * POST /api/generate-portrait
 * Kullanıcının fotoğrafından profesyonel portre üretir.
 * Yalnızca individual ve team planlarına açık.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Oturum açmanız gerekiyor" },
        { status: 401 }
      );
    }

    // Plan kontrolü
    const serviceClient = await createServiceClient();
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    if (!profile || profile.plan === "free") {
      return NextResponse.json(
        {
          error:
            "Portre oluşturma özelliği ücretli planlara özeldir. Lütfen planınızı yükseltin.",
        },
        { status: 403 }
      );
    }

    // Body parse
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Geçersiz istek verisi" },
        { status: 400 }
      );
    }

    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error:
            validation.error.issues[0]?.message || "Geçersiz fotoğraf verisi",
        },
        { status: 400 }
      );
    }

    const { imageBase64, mimeType, style } = validation.data;

    // Gemini Image API çağrısı
    const result = await generatePortrait({
      imageBase64,
      mimeType,
      style: style as PortraitStyle,
    });

    return NextResponse.json({
      success: true,
      portrait: {
        imageBase64: result.imageBase64,
        mimeType: result.mimeType,
        isFallback: result.isFallback,
        fallbackReason: result.fallbackReason,
      },
    });
  } catch (error) {
    console.error("Generate portrait error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Portre oluşturulurken bir hata oluştu";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
