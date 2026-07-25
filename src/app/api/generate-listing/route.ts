import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWithGemini } from "@/lib/ai/gemini";
import { buildUserPrompt } from "@/lib/ai/prompts";

const FREE_PLAN_LIMIT = 5;

// Simple in-memory rate limiting (per user, max 3 requests per minute)
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 3;

  const timestamps = rateLimitMap.get(userId) || [];
  const recentTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (recentTimestamps.length >= maxRequests) {
    return false;
  }

  recentTimestamps.push(now);
  rateLimitMap.set(userId, recentTimestamps);
  return true;
}

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

    // Rate limit kontrolü
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: "Çok fazla istek gönderdiniz. Lütfen 1 dakika bekleyin." },
        { status: 429 }
      );
    }

    // Profil ve limit kontrolü
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profil bulunamadı" },
        { status: 404 }
      );
    }

    // Aylık sayaç sıfırlama kontrolü
    const resetDate = new Date(profile.monthly_count_reset_at);
    const now = new Date();
    let currentCount = profile.monthly_listing_count;

    if (
      resetDate.getMonth() !== now.getMonth() ||
      resetDate.getFullYear() !== now.getFullYear()
    ) {
      // Yeni ay, sayacı sıfırla
      await supabase
        .from("profiles")
        .update({
          monthly_listing_count: 0,
          monthly_count_reset_at: now.toISOString(),
        })
        .eq("id", user.id);
      currentCount = 0;
    }

    // Ücretsiz plan limit kontrolü
    if (profile.plan === "free" && currentCount >= FREE_PLAN_LIMIT) {
      return NextResponse.json(
        {
          error: "Aylık ücretsiz ilan limitinize ulaştınız. Devam etmek için planınızı yükseltin.",
          limitReached: true,
        },
        { status: 403 }
      );
    }

    // Form verisini al
    const formData = await request.json();

    // Kullanıcı promptunu oluştur
    const userPrompt = buildUserPrompt({
      ...formData,
      contactName: profile.full_name,
      contactPhone: formData.contactPhone || profile.phone_number,
      officeName: profile.office_name,
    });

    // Gemini API çağrısı
    const result = await generateWithGemini(userPrompt);

    // Veritabanına kaydet
    const propertyTypeMap: Record<string, string> = {
      Daire: "daire",
      Villa: "villa",
      Arsa: "arsa",
      İşyeri: "isyeri",
      Diğer: "diger",
    };

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .insert({
        user_id: user.id,
        property_type: propertyTypeMap[formData.propertyType] || "diger",
        input_data: formData,
        output_resmi: result.resmi,
        output_samimi: result.samimi,
        output_kisa: result.kisa,
      })
      .select()
      .single();

    if (listingError) {
      console.error("Listing kayıt hatası:", listingError);
      return NextResponse.json(
        { error: "İlan kaydedilirken bir hata oluştu" },
        { status: 500 }
      );
    }

    // Aylık sayacı artır
    await supabase
      .from("profiles")
      .update({
        monthly_listing_count: currentCount + 1,
      })
      .eq("id", user.id);

    return NextResponse.json({
      success: true,
      listing,
      result,
      remainingCount: FREE_PLAN_LIMIT - (currentCount + 1),
    });
  } catch (error) {
    console.error("Generate listing error:", error);
    const message =
      error instanceof Error ? error.message : "Bir şeyler ters gitti";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
