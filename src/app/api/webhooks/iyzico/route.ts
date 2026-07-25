import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // TODO: iyzico webhook signature doğrulama
    const body = await request.json();

    console.log("iyzico webhook received:", body);

    // TODO: Gerçek iyzico entegrasyonu
    // - body.paymentStatus kontrol et
    // - subscriptions tablosunu güncelle
    // - profiles.plan güncelle

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("iyzico webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
