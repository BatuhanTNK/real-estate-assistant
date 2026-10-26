import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API anahtarı yapılandırılmamış" },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      price,
      location,
      area,
      rooms,
      floor,
      badgeText,
      notes,
    } = body;

    const prompt = `Sen profesyonel bir lüks gayrimenkul ve sosyal medya içerik uzmanısın.
Aşağıdaki mülk bilgileri için Instagram Carousel postuna uygun, etkileşimi ve arama potansiyelini maksimize eden Türkçe bir Instagram gönderi metni (caption) oluştur.

Mülk Bilgileri:
- Rozet / İlan Başlığı: ${badgeText || "Satılık İlan"}
- Fiyat: ${price || "Fiyat için DM"}
- Konum: ${location || "Belirtilmedi"}
- Alan (m²): ${area || "Belirtilmedi"}
- Oda Sayısı: ${rooms || "Belirtilmedi"}
- Kat: ${floor || "Belirtilmedi"}
- Ek Notlar / Özellikler: ${notes || "Yok"}

Metin Kuralları:
1. Dikkat çekici, merak uyandıran emojili bir ilk cümle (Hook).
2. Temel özellikleri şık emojili maddeler halinde sırala (Fiyat, m², Oda, Konum vb.).
3. Mülkün sunduğu prestijli yaşam tarzını veya yatırım değerini vurgulayan samimi ama kurumsal 1-2 cümle.
4. Güçlü bir eyleme çağrı (CTA: "Detaylı bilgi ve randevu için DM veya profilimizdeki iletişim numarası").
5. En alta 12-15 adet popüler, keşfete düşüren Türkçe emlak hashtagi ekle (#emlak #gayrimenkul #satilikdaire vb.).
6. Yalnızca oluşturduğun Instagram açıklama metnini döndür, başına ve sonuna markdown kod bloğu (\`\`\`) veya açıklama ekleme.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini caption error:", errText);
      return NextResponse.json(
        { error: "AI metin üretimi sırasında bir hata oluştu" },
        { status: 500 }
      );
    }

    const data = await geminiRes.json();
    const caption =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!caption) {
      return NextResponse.json(
        { error: "Açıklama metni üretilemedi" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, caption });
  } catch (error) {
    console.error("Caption generation error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası, lütfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
