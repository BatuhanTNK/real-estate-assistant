import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const forgotPasswordSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
});

/**
 * Şifre sıfırlama e-postası gönderir.
 * Güvenlik: e-posta kayıtlı olmasa bile 200 döner (enumerasyon saldırısını önler).
 */
export async function POST(request: NextRequest) {
  try {
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
    }

    const validation = forgotPasswordSchema.safeParse(raw);
    if (!validation.success) {
      const first = validation.error.issues[0];
      return NextResponse.json(
        { error: first ? first.message : "Geçersiz e-posta" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const redirectTo =
      typeof request.nextUrl !== "undefined"
        ? `${request.nextUrl.origin}/auth`
        : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(
      validation.data.email,
      redirectTo ? { redirectTo } : undefined
    );

    if (error) {
      console.error("Şifre sıfırlama hatası:", error);
      // Yine de başarılı döner — kullanıcı varlığını ifşa etmemek için
      return NextResponse.json({
        success: true,
        message: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi (eğer hesap varsa).",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi (eğer hesap varsa).",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bir hata oluştu" },
      { status: 500 }
    );
  }
}
