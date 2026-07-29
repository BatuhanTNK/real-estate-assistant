import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getIyzipayInstance } from "@/lib/iyzico/client";

export const dynamic = "force-dynamic";

/**
 * POST /api/checkout/callback
 * İyzico Ödeme Formu tamamlandığında yönlendirilen callback endpoint'i.
 */
export async function POST(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const formData = await request.formData();
    const token = formData.get("token") as string;

    if (!token) {
      console.error("Callback: token eksik");
      return NextResponse.redirect(`${appUrl}/pricing?error=token_missing`);
    }

    const iyzipay = getIyzipayInstance();

    // İyzico'dan ödeme durumunu sorgula
    const retrieveRequest = { token, locale: "tr" };

    const paymentResult = await new Promise<{
      status: string;
      paymentStatus?: string;
      basketId?: string;
      price?: number;
      paymentId?: string;
      errorMessage?: string;
    }>((resolve) => {
      iyzipay.checkoutForm.retrieve(retrieveRequest, (err: unknown, result: { status: string; paymentStatus?: string; basketId?: string; price?: number; paymentId?: string; errorMessage?: string }) => {
        if (err) {
          resolve({ status: "failure", errorMessage: String(err) });
        } else {
          resolve(result);
        }
      });
    });

    if (paymentResult.status !== "success" || paymentResult.paymentStatus !== "SUCCESS") {
      console.error("iyzico payment failed:", paymentResult.errorMessage);
      return NextResponse.redirect(`${appUrl}/pricing?error=payment_failed`);
    }

    // Supabase işlemleri (Service role with RLS bypass)
    const serviceClient = await createServiceClient();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Basket ID veya varsayılan plandan seçimi tespit et
      const basketId = paymentResult.basketId || "";
      const isTeam = basketId.includes("team") || (paymentResult.price && paymentResult.price > 200);
      const plan = isTeam ? "team" : "individual";

      // 1) subscriptions tablosuna yaz
      await serviceClient.from("subscriptions").insert({
        user_id: user.id,
        plan: plan,
        status: "active",
        iyzico_subscription_id: paymentResult.paymentId || token,
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // 2) profiles.plan güncelle ve aylık kullanımı sıfırla
      await serviceClient
        .from("profiles")
        .update({
          plan: plan,
          monthly_listing_count: 0,
          monthly_count_reset_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }

    return NextResponse.redirect(`${appUrl}/dashboard?payment=success`);
  } catch (error) {
    console.error("Checkout callback error:", error);
    return NextResponse.redirect(`${appUrl}/pricing?error=server_error`);
  }
}
