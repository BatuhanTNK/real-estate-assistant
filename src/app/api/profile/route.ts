import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const phoneRegex = /^(\+?90\s?)?0?5\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/;

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Ad soyad en az 2 karakter").max(100),
  officeName: z.string().trim().max(100).optional().or(z.literal("")),
  logoUrl: z.string().trim().url().optional().or(z.literal("")),
  phoneNumber: z
    .string()
    .trim()
    .max(32)
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || phoneRegex.test(val.replace(/\s+/g, " ").trim()),
      "Geçersiz telefon numarası formatı"
    ),
});

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
    }

    const validation = updateProfileSchema.safeParse(raw);
    if (!validation.success) {
      const first = validation.error.issues[0];
      return NextResponse.json(
        { error: first ? first.message : "Form verisi geçersiz" },
        { status: 400 }
      );
    }
    const data = validation.data;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: data.fullName,
        office_name: data.officeName || null,
        logo_url: data.logoUrl || null,
        phone_number: data.phoneNumber || null,
      })
      .eq("id", user.id);

    if (error) {
      console.error("Profil güncelleme hatası:", error);
      return NextResponse.json(
        { error: "Profil güncellenemedi" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bir hata oluştu" },
      { status: 500 }
    );
  }
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, "Mevcut şifre en az 6 karakter"),
    newPassword: z.string().min(6, "Yeni şifre en az 6 karakter").max(72),
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "Yeni şifre mevcut şifreden farklı olmalı",
    path: ["newPassword"],
  });

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
    }

    const validation = changePasswordSchema.safeParse(raw);
    if (!validation.success) {
      const first = validation.error.issues[0];
      return NextResponse.json(
        { error: first ? first.message : "Şifre verisi geçersiz" },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validation.data;

    // Mevcut şifreyi doğrula — signInWithPassword ile.
    // NOT: Bu yeni bir session oluşturur ama kullanıcı zaten giriş yapmış.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email ?? "",
      password: currentPassword,
    });

    if (signInError) {
      return NextResponse.json(
        { error: "Mevcut şifre hatalı" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error("Şifre güncelleme hatası:", updateError);
      return NextResponse.json(
        { error: updateError.message || "Şifre güncellenemedi" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bir hata oluştu" },
      { status: 500 }
    );
  }
}
