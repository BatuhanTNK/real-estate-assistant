import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  translateWithGemini,
  LANGUAGE_LABELS,
  type TranslationLanguage,
} from "@/lib/ai/translate";
import { z } from "zod";

export const dynamic = "force-dynamic";

const translateSchema = z.object({
  text: z.string().min(10, "Metin en az 10 karakter olmalı").max(5000),
  language: z.enum(["en", "ar", "ru", "de", "fr"]),
});

/**
 * POST /api/translate-listing
 * Mevcut ilan metnini seçilen dile çevirir.
 * Kota tüketmez.
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

    const validation = translateSchema.safeParse(rawBody);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message || "Geçersiz veri" },
        { status: 400 }
      );
    }

    const { text, language } = validation.data;
    const translated = await translateWithGemini(
      text,
      language as TranslationLanguage
    );

    return NextResponse.json({
      success: true,
      translated,
      language,
      languageLabel: LANGUAGE_LABELS[language as TranslationLanguage],
    });
  } catch (error) {
    console.error("Translate listing error:", error);
    const message =
      error instanceof Error ? error.message : "Bir şeyler ters gitti";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
