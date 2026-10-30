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
      platform = "instagram",
    } = body;

    const propertySummary = `Mülk Bilgileri:
- Rozet / İlan Başlığı: ${badgeText || "Satılık İlan"}
- Fiyat: ${price || "Fiyat için iletişime geçiniz"}
- Konum: ${location || "Belirtilmedi"}
- Alan (m²): ${area || "Belirtilmedi"}
- Oda Sayısı: ${rooms || "Belirtilmedi"}
- Kat: ${floor || "Belirtilmedi"}
- Ek Notlar / Özellikler: ${notes || "Yok"}`;

    let prompt = "";

    if (platform === "sahibinden") {
      prompt = `Sen Türkiye'nin en deneyimli kurumsal gayrimenkul danışmanı ve Sahibinden.com ilan uzmanısın.
Aşağıdaki mülk bilgileri için Sahibinden.com'da üst sıralara çıkacak, güven veren, detaylı ve kurumsal bir ilan açıklaması oluştur.

${propertySummary}

Metin Kuralları:
1. En üstte dikkat çekici, tamamı büyük harflerden oluşan bir İLAN BAŞLIĞI önerisi yaz.
2. Mülkün temel teknik özelliklerini (Konum, m², Oda Sayısı, Kat, Fiyat avantajı) net ve düzenli maddeler halinde sun.
3. İç mekan kalitesi, cephe/manzara, ulaşım olanakları (toplu taşıma, okul, market, ana arterler) ve yatırım değerini kurumsal bir dille anlat.
4. En altta profesyonel bir iletişim ve randevu çağrısı ekle ("Detaylı bilgi ve yerinde sunum için lütfen iletişime geçiniz").
5. Kesinlikle sosyal medya hashtag'i (#) kullanma. Yalnızca Sahibinden.com ilan metnini döndür.`;
    } else if (platform === "facebook") {
      prompt = `Sen profesyonel bir gayrimenkul sosyal medya ve Facebook Marketplace / Emlak Grupları içerik uzmanısın.
Aşağıdaki mülk bilgileri için Facebook akışında, emlak gruplarında ve Facebook Marketplace'te yüksek etkileşim ve mesaj getirecek Türkçe bir paylaşım metni oluştur.

${propertySummary}

Metin Kuralları:
1. Güven veren ve dikkat çeken bir başlık / ilk cümle ile başla.
2. Temel bilgileri (📍 Konum, 💰 Fiyat, 📐 Alan, 🚪 Oda Sayısı, 🏢 Kat) okunaklı maddeler halinde sırala.
3. Aile yaşamına uygunluk, krediye/yatırıma uygunluk ve bölge avantajlarını samimi ama profesyonel bir dille 2-3 cümlede anlat.
4. Net bir eyleme çağrı ekle ("Detaylı bilgi, konum ve randevu için Messenger'dan mesaj atabilir veya telefon numaramızdan hemen ulaşabilirsiniz").
5. En alta yalnızca 4-5 adet temiz etiket ekle (#satılıkkonut #gayrimenkul #emlak #yatırım).
6. Yalnızca oluşturduğun Facebook paylaşım metnini döndür.`;
    } else {
      prompt = `Sen profesyonel bir lüks gayrimenkul ve sosyal medya içerik uzmanısın.
Aşağıdaki mülk bilgileri için Instagram Carousel ve Reels paylaşımına uygun, etkileşimi ve keşfet potansiyelini maksimize eden Türkçe bir Instagram gönderi metni (caption) oluştur.

${propertySummary}

Metin Kuralları:
1. Dikkat çekici, merak uyandıran emojili bir ilk cümle (Hook).
2. Temel özellikleri şık emojili maddeler halinde sırala (Fiyat, m², Oda, Konum vb.).
3. Mülkün sunduğu prestijli yaşam tarzını veya yatırım değerini vurgulayan samimi ama kurumsal 1-2 cümle.
4. Güçlü bir eyleme çağrı (CTA: "Detaylı bilgi ve randevu için DM veya profilimizdeki iletişim numarası").
5. En alta 12-15 adet popüler, keşfete düşüren Türkçe emlak hashtagi ekle (#emlak #gayrimenkul #satilikdaire vb.).
6. Yalnızca oluşturduğun Instagram açıklama metnini döndür, başına ve sonuna markdown kod bloğu (\`\`\`) veya açıklama ekleme.`;
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1200,
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

    return NextResponse.json({ success: true, caption, platform });
  } catch (error) {
    console.error("Caption generation error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası, lütfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
