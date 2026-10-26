import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import { isTestCheckoutEnabled } from "@/lib/checkout-mode";

export const dynamic = "force-dynamic";

const simulateSchema = z.object({
  plan: z.enum(["individual", "team", "free"]),
});

/**
 * POST /api/checkout/simulate
 * Test modunda tek tıkla plan yükseltme / düşürme (Geliştirici ortamı için).
 */
export async function POST(request: NextRequest) {
  if (!isTestCheckoutEnabled()) {
    return NextResponse.json({ error: "Test ödemeleri bu ortamda kapalı" }, { status: 403 });
  }
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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    }

    const validation = simulateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Geçersiz plan" }, { status: 400 });
    }

    const { plan } = validation.data;
    const serviceClient = await createServiceClient();

    // subscriptions güncelle/ekle
    if (plan !== "free") {
      await serviceClient.from("subscriptions").insert({
        user_id: user.id,
        plan: plan,
        status: "active",
        iyzico_subscription_id: `sim_${Date.now()}`,
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    // profiles.plan güncelle
    const { error: profileError } = await serviceClient
      .from("profiles")
      .update({
        plan: plan,
        monthly_listing_count: 0,
        monthly_count_reset_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("Simulate plan update error:", profileError);
      return NextResponse.json(
        { error: "Plan güncellenemedi" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plan,
      message: `Planınız ${plan === "individual" ? "Bireysel" : plan === "team" ? "Ofis" : "Ücretsiz"} olarak güncellendi.`,
    });
  } catch (error) {
    console.error("Simulate route error:", error);
    return NextResponse.json({ error: "İşlem başarısız" }, { status: 500 });
  }
}
