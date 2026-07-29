/**
 * Metin İyileştirme (Refine) — mevcut ilan metnini kullanıcının yönergesiyle
 * düzenler. Kota tüketmez, sadece mevcut metni iyileştirir.
 */

const REFINE_SYSTEM_PROMPT = `Sen bir emlak ilan metni editörüsün. Sana bir ilan metni ve kullanıcının düzenleme yönergesi verilecek.

KURALLAR:
- Yönergeye göre metni düzenle, ama metnin genel yapısını koru
- Sadece istenen değişikliği yap, gereksiz ekleme/çıkarma yapma
- Profesyonel emlak dili kullan
- Emoji kullanma
- Yalnızca düzenlenmiş metni döndür, başka açıklama ekleme
- JSON formatında yanıt ver: {"refined": "..."}`;

export async function refineWithGemini(
  originalText: string,
  instruction: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const userPrompt = `Orijinal ilan metni:
"""
${originalText}
"""

Düzenleme yönergesi: ${instruction}

Metni yönergeye göre düzenle ve JSON formatında döndür.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: REFINE_SYSTEM_PROMPT }],
        },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    console.error("Gemini refine API error:", errorData);
    throw new Error(`Gemini API hatası: ${response.status}`);
  }

  const data = await response.json();

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error("Gemini API boş yanıt döndürdü");
  }

  const text = data.candidates[0].content.parts[0].text;
  const cleanedText = text
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    const parsed = JSON.parse(cleanedText);
    if (!parsed.refined) {
      throw new Error("Yanıtta 'refined' alanı bulunamadı");
    }
    return parsed.refined;
  } catch {
    console.error("Refine JSON parse hatası:", cleanedText);
    throw new Error("AI yanıtı beklenen formatta değil, lütfen tekrar deneyin");
  }
}
