import { SupabaseClient } from "@supabase/supabase-js";
import { generateWithGemini } from "./gemini";
import { buildUserPrompt } from "./prompts";
import type { ListingFormData } from "./validation";

/**
 * İlan üretimi çekirdeği — hem /api/generate-listing (tek) hem
 * /api/import (batch) tarafından paylaşılır.
 *
 * Akış: profile çek → consume_listing_quota (atomic) → buildUserPrompt →
 * generateWithGemini → DB insert → (hata durumunda refund).
 *
 * Kota kullanıcı bazlıdır (kullanıcı kararı: ekip paylaşımsız).
 *
 * NOT: Rate-limit kontrolü burada DEĞİL — çağıran route yapar
 * (tek istek için 1, batch için 1 kez toplam).
 */

export const FREE_PLAN_LIMIT = 5;

const propertyTypeMap: Record<string, string> = {
  Daire: "daire",
  Villa: "villa",
  Arsa: "arsa",
  İşyeri: "isyeri",
  Diğer: "diger",
};

export interface GenerationInput {
  formData: ListingFormData;
  profile: {
    full_name: string | null;
    phone_number: string | null;
    office_name: string | null;
  };
}

export interface GenerationSuccess {
  ok: true;
  listing: {
    id: string;
    property_type: string;
    [key: string]: unknown;
  };
  result: { resmi: string; samimi: string; kisa: string };
  remainingCount: number | null;
  plan: string;
}

export interface GenerationFailure {
  ok: false;
  /** Http durum kodu önerisi (çağıran route'a kolaylık). */
  status: number;
  error: string;
  /** Kota tüketilmiş ama geri alındı mı? (AI/DB hatası için) */
  limitReached?: boolean;
}

/**
 * Kullanıcı başına ilan üretir. `serviceClient` RLS bypass'lı
 * quota/RPC çağrıları içindir; `client` kullanıcının kendi oturumuyla
 * profile/listing CRUD'si için (RLS altında).
 */
export async function processListingGeneration(args: {
  userId: string;
  formData: ListingFormData;
  profile: GenerationInput["profile"];
  supabase: SupabaseClient; // kullanıcı oturumu
  serviceClient: SupabaseClient; // service role, quota/rpc
}): Promise<GenerationSuccess | GenerationFailure> {
  const { userId, formData, profile, supabase, serviceClient } = args;

  // 1) Atomik kota artırımı
  const {
    data: quota,
    error: quotaError,
  } = await serviceClient.rpc("consume_listing_quota", {
    p_user_id: userId,
    p_free_limit: FREE_PLAN_LIMIT,
  });

  let allowed = true;
  let plan = "free";
  let currentCount = 0;

  if (quotaError) {
    if (quotaError.code === "PGRST202") {
      const { data: prof } = await supabase
        .from("profiles")
        .select("plan, monthly_listing_count")
        .eq("id", userId)
        .single();
      plan = prof?.plan || "free";
      const existingCount = prof?.monthly_listing_count || 0;
      if (plan === "free" && existingCount >= FREE_PLAN_LIMIT) {
        allowed = false;
        currentCount = existingCount;
      } else {
        currentCount = existingCount + 1;
        await supabase
          .from("profiles")
          .update({ monthly_listing_count: currentCount })
          .eq("id", userId);
      }
    } else {
      console.error("Quota RPC hatası:", quotaError);
      return { ok: false, status: 500, error: "Kullanım kontrolü yapılamadı" };
    }
  } else {
    allowed = (quota as { allowed: boolean })?.allowed ?? false;
    plan = (quota as { plan: string })?.plan ?? "free";
    currentCount = (quota as { current_count: number })?.current_count ?? 0;
  }

  if (!allowed) {
    return {
      ok: false,
      status: 403,
      error:
        "Aylık ücretsiz ilan limitinize ulaştınız. Devam etmek için planınızı yükseltin.",
      limitReached: true,
    };
  }

  // 2) Prompt
  const userPrompt = buildUserPrompt({
    ...formData,
    contactName: profile.full_name || undefined,
    contactPhone: formData.contactPhone || profile.phone_number || undefined,
    officeName: profile.office_name || undefined,
  });

  // 3) Gemini
  let result: { resmi: string; samimi: string; kisa: string };
  try {
    result = await generateWithGemini(userPrompt);
  } catch (aiError) {
    await serviceClient.rpc("refund_listing_quota", { p_user_id: userId });
    console.error("AI hatası:", aiError);
    const message =
      aiError instanceof Error ? aiError.message : "İlan metni oluşturulamadı";
    return { ok: false, status: 502, error: message };
  }

  // 4) DB insert
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .insert({
      user_id: userId,
      property_type: propertyTypeMap[formData.propertyType] || "diger",
      input_data: formData as unknown as Record<string, unknown>,
      output_resmi: result.resmi,
      output_samimi: result.samimi,
      output_kisa: result.kisa,
    })
    .select()
    .single();

  if (listingError) {
    console.error("Listing kayıt hatası:", listingError);
    await serviceClient.rpc("refund_listing_quota", { p_user_id: userId });
    return {
      ok: false,
      status: 500,
      error: "İlan kaydedilirken bir hata oluştu",
    };
  }

  const remaining = plan === "free" ? Math.max(0, FREE_PLAN_LIMIT - currentCount) : null;

  return {
    ok: true,
    listing: listing as GenerationSuccess["listing"],
    result,
    remainingCount: remaining,
    plan,
  };
}
