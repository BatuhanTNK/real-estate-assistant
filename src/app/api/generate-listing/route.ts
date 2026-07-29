import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { validateListingForm } from "@/lib/ai/validation";
import { processListingGeneration } from "@/lib/ai/generate";

export const dynamic = "force-dynamic";

const RATE_LIMIT_MAX = 3; // dk başına
const RATE_LIMIT_WINDOW_SEC = 60;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth kontrolü
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Oturum açmanız gerekiyor" },
        { status: 401 }
      );
    }

    // ── 1) Sunucu tarafı form doğrulama (zod) ──
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Geçersiz istek gövdesi" },
        { status: 400 }
      );
    }

    const validation = validateListingForm(rawBody);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const formData = validation.data;

    // ── 2) Kalıcı rate limiting (DB tablosu, service role) ──
    const serviceClient = await createServiceClient();
    const { data: rateOk, error: rateError } = await serviceClient.rpc(
      "check_rate_limit",
      {
        p_user_id: user.id,
        p_endpoint: "generate-listing",
        p_max_requests: RATE_LIMIT_MAX,
        p_window_seconds: RATE_LIMIT_WINDOW_SEC,
      }
    );

    if (rateError) {
      if (rateError.code !== "PGRST202") {
        console.error("Rate limit RPC hatası:", rateError);
        return NextResponse.json(
          { error: "İstek işlenemedi, lütfen tekrar deneyin" },
          { status: 500 }
        );
      }
    } else if (!rateOk) {
      return NextResponse.json(
        {
          error: "Çok fazla istek gönderdiniz. Lütfen 1 dakika bekleyin.",
        },
        { status: 429 }
      );
    }

    // ── 3) Profil bilgi ──
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone_number, office_name")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Profil bulunamadı" },
        { status: 404 }
      );
    }

    // ── 4) Çekirdek üretim (kota → prompt → Gemini → DB) ──
    const outcome = await processListingGeneration({
      userId: user.id,
      formData,
      profile,
      supabase,
      serviceClient,
    });

    if (!outcome.ok) {
      const body: Record<string, unknown> = { error: outcome.error };
      if (outcome.limitReached) body.limitReached = true;
      return NextResponse.json(body, { status: outcome.status });
    }

    return NextResponse.json({
      success: true,
      listing: outcome.listing,
      result: outcome.result,
      remainingCount: outcome.remainingCount,
      plan: outcome.plan,
    });
  } catch (error) {
    console.error("Generate listing error:", error);
    const message =
      error instanceof Error ? error.message : "Bir şeyler ters gitti";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
