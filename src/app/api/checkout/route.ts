import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getIyzipayInstance, PLANS_CONFIG } from "@/lib/iyzico/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

const checkoutSchema = z.object({
  plan: z.enum(["individual", "team"]),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Ödeme yapmak için oturum açmanız gerekiyor" },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Geçersiz istek" },
        { status: 400 }
      );
    }

    const validation = checkoutSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Geçersiz plan seçimi" },
        { status: 400 }
      );
    }

    const selectedPlanKey = validation.data.plan;
    const planConfig = PLANS_CONFIG[selectedPlanKey];

    // Profil bilgilerini al
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const fullName = profile?.full_name || user.email?.split("@")[0] || "Değerli Müşteri";
    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0] || "Kullanıcı";
    const lastName = nameParts.slice(1).join(" ") || "Soyadı";
    const email = user.email || "kullanici@example.com";
    const phone = profile?.phone_number || "+905320000000";

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const callbackUrl = `${appUrl}/api/checkout/callback`;

    // İyzico Checkout Form Initialize Request
    const iyzipay = getIyzipayInstance();

    const iyziRequest = {
      locale: "tr",
      conversationId: `conv_${user.id}_${Date.now()}`,
      price: planConfig.price,
      paidPrice: planConfig.price,
      currency: "TRY",
      basketId: `B_${user.id.slice(0, 8)}_${Date.now()}`,
      paymentGroup: "SUBSCRIPTION",
      callbackUrl: callbackUrl,
      enabledInstallments: [1],
      buyer: {
        id: user.id,
        name: firstName,
        surname: lastName,
        gsmNumber: phone.startsWith("+") ? phone : `+90${phone.replace(/\D/g, "")}`,
        email: email,
        identityNumber: "11111111111",
        registrationAddress: "Türkiye",
        ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
        city: "Istanbul",
        country: "Turkey",
      },
      shippingAddress: {
        contactName: fullName,
        city: "Istanbul",
        country: "Turkey",
        address: "Türkiye",
      },
      billingAddress: {
        contactName: fullName,
        city: "Istanbul",
        country: "Turkey",
        address: "Türkiye",
      },
      basketItems: [
        {
          id: `plan_${planConfig.id}`,
          name: `${planConfig.name} - İlan Asistanı`,
          category1: "Yazılım",
          category2: "Abonelik",
          itemType: "VIRTUAL",
          price: planConfig.price,
        },
      ],
    };

    return new Promise<NextResponse>((resolve) => {
      iyzipay.checkoutFormInitialize.create(iyziRequest as unknown as Parameters<typeof iyzipay.checkoutFormInitialize.create>[0], (err: unknown, result: { status: string; checkoutFormContent?: string; token?: string; errorMessage?: string }) => {
        if (err || result.status !== "success" || !result.checkoutFormContent) {
          console.error("iyzico checkout init hatası:", err || result.errorMessage);

          // Provider failures must never be reported as successful payments.
          resolve(
            NextResponse.json({
              error: "Ödeme hizmetine şu anda ulaşılamıyor. Lütfen daha sonra tekrar deneyin.",
            }, { status: 502 })
          );
          return;
        }

        resolve(
          NextResponse.json({
            success: true,
            isTestMode: false,
            checkoutFormContent: result.checkoutFormContent,
            token: result.token,
          })
        );
      });
    });
  } catch (error) {
    console.error("Checkout route error:", error);
    return NextResponse.json(
      { error: "Ödeme formu başlatılamadı" },
      { status: 500 }
    );
  }
}
