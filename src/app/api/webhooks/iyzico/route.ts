import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * POST /api/webhooks/iyzico
 * İyzico abonelik iptali veya yenileme bildirimleri dinleyicisi.
 */
export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Geçersiz webhook verisi" },
        { status: 400 }
      );
    }

    console.log("iyzico webhook received:", body);

    const eventType = body.eventType || body.event || body.iyziEventType;
    const paymentStatus = body.status || body.paymentStatus;
    const subscriptionId = (body.subscriptionId || body.iyziReferenceCode || body.paymentId) as string;

    const serviceClient = await createServiceClient();

    if (eventType === "CANCELLED" || paymentStatus === "CANCELLED" || paymentStatus === "FAILURE") {
      if (subscriptionId) {
        // İlgili aboneliği bul
        const { data: sub } = await serviceClient
          .from("subscriptions")
          .select("user_id")
          .eq("iyzico_subscription_id", subscriptionId)
          .single();

        if (sub?.user_id) {
          // Status cancelled yap ve profili free'ye çek
          await serviceClient
            .from("subscriptions")
            .update({ status: "cancelled" })
            .eq("iyzico_subscription_id", subscriptionId);

          await serviceClient
            .from("profiles")
            .update({ plan: "free" })
            .eq("id", sub.user_id);
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("iyzico webhook error:", error);
    return NextResponse.json(
      { error: "Webhook işlenemedi" },
      { status: 500 }
    );
  }
}
