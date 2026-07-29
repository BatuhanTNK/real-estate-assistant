import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { refineWithGemini } from "@/lib/ai/refine";
import { z } from "zod";

export const dynamic = "force-dynamic";

const refineSchema = z.object({
  text: z.string().min(10, "Metin en az 10 karakter olmalı").max(5000),
  instruction: z.string().min(3, "Yönerge en az 3 karakter olmalı").max(500),
});

/**
 * POST /api/refine-listing
 * Mevcut ilan metnini kullanıcının yönergesiyle düzenler.
 * Kota tüketmez — sadece metin iyileştirme.
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

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Geçersiz istek gövdesi" },
        { status: 400 }
      );
    }

    const validation = refineSchema.safeParse(rawBody);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message || "Geçersiz veri" },
        { status: 400 }
      );
    }

    const { text, instruction } = validation.data;
    const refined = await refineWithGemini(text, instruction);

    return NextResponse.json({ success: true, refined });
  } catch (error) {
    console.error("Refine listing error:", error);
    const message =
      error instanceof Error ? error.message : "Bir şeyler ters gitti";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
