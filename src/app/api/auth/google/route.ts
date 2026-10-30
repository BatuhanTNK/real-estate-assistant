import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

interface GoogleUserInfo {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      accessToken?: string;
      code?: string;
      redirectUri?: string;
    };

    let accessToken = body.accessToken;

    if (!accessToken && body.code) {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        return NextResponse.json(
          { error: "Google OAuth istemci bilgileri eksik." },
          { status: 500 }
        );
      }

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: body.code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: body.redirectUri || `${request.nextUrl.origin}/auth/callback`,
          grant_type: "authorization_code",
        }),
      });

      const tokenData = (await tokenRes.json()) as {
        access_token?: string;
        error_description?: string;
        error?: string;
      };

      if (!tokenRes.ok || !tokenData.access_token) {
        return NextResponse.json(
          { error: tokenData.error_description || tokenData.error || "Google yetkilendirme kodu doğrulanamadı." },
          { status: 401 }
        );
      }
      accessToken = tokenData.access_token;
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: "Google erişim anahtarı (access_token) bulunamadı." },
        { status: 400 }
      );
    }

    // 1) Google üzerinden kullanıcı bilgilerini doğrula
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userInfoRes.ok) {
      return NextResponse.json(
        { error: "Google hesap bilgileri doğrulanamadı." },
        { status: 401 }
      );
    }

    const googleUser = (await userInfoRes.json()) as GoogleUserInfo;
    if (!googleUser.email || googleUser.email_verified === false) {
      return NextResponse.json(
        { error: "Google hesabınızda doğrulanmış bir e-posta adresi bulunamadı." },
        { status: 400 }
      );
    }

    const fullName =
      googleUser.name?.trim() ||
      [googleUser.given_name, googleUser.family_name].filter(Boolean).join(" ").trim() ||
      googleUser.email.split("@")[0];

    // 2) Supabase Admin ile tek kullanımlık oturum token_hash üret (kullanıcı yoksa oluşturur)
    const serviceClient = await createServiceClient();
    const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
      type: "magiclink",
      email: googleUser.email,
      options: {
        data: {
          full_name: fullName,
          name: fullName,
          avatar_url: googleUser.picture || "",
          provider: "google",
        },
      },
    });

    const hashedToken = linkData?.properties?.hashed_token;
    if (linkError || !hashedToken) {
      console.error("Supabase generateLink error:", linkError);
      return NextResponse.json(
        { error: linkError?.message || "Supabase oturumu oluşturulamadı." },
        { status: 500 }
      );
    }

    // 3) SSR Supabase istemcisi üzerinden token_hash doğrulayarak çerezleri (cookies) yaz
    const supabase = await createClient();
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: hashedToken,
      type: "magiclink",
    });

    if (verifyError || !verifyData.user) {
      console.error("Supabase verifyOtp error:", verifyError);
      return NextResponse.json(
        { error: verifyError?.message || "Oturum doğrulanamadı." },
        { status: 500 }
      );
    }

    // 4) Profil tablosunda kaydın ve ismin bulunduğundan emin ol
    const userId = verifyData.user.id;
    const { data: existingProfile } = await serviceClient
      .from("profiles")
      .select("id, full_name")
      .eq("id", userId)
      .maybeSingle();

    if (!existingProfile) {
      await serviceClient.from("profiles").insert({
        id: userId,
        full_name: fullName,
      });
    } else if (!existingProfile.full_name?.trim() && fullName) {
      await serviceClient
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", userId);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: verifyData.user.email,
        fullName,
      },
    });
  } catch (err: unknown) {
    console.error("Google auth API error:", err);
    return NextResponse.json(
      { error: "Google ile giriş sırasında beklenmeyen bir hata oluştu." },
      { status: 500 }
    );
  }
}
