/**
 * Çeviri modülü — mevcut ilan metnini farklı dillere çevirir.
 * Kota tüketmez.
 */

export type TranslationLanguage = "en" | "ar" | "ru" | "de" | "fr";

export const LANGUAGE_LABELS: Record<TranslationLanguage, string> = {
  en: "English",
  ar: "العربية",
  ru: "Русский",
  de: "Deutsch",
  fr: "Français",
};

export const LANGUAGE_FLAGS: Record<TranslationLanguage, string> = {
  en: "🇬🇧",
  ar: "🇸🇦",
  ru: "🇷🇺",
  de: "🇩🇪",
  fr: "🇫🇷",
};

const TRANSLATE_SYSTEM_PROMPT = `Sen profesyonel bir emlak ilan çevirmenisin. Sana Türkçe bir emlak ilan metni ve hedef dil verilecek.

KURALLAR:
- Metni hedef dile doğal ve profesyonel şekilde çevir
- Emlak terminolojisini hedef dilde doğru kullan
- Para birimi TL olarak kalsın, ama hedef dilin formatında yaz (örn. İngilizce: "TL 4,500,000")
- Konum isimleri (mahalle, ilçe, il) çevrilmemeli, olduğu gibi kalmalı
- Metindeki telefon numarası aynen kalmalı
- JSON formatında yanıt ver: {"translated": "..."}`;

export async function translateWithGemini(
  originalText: string,
  targetLanguage: TranslationLanguage
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const languageName = LANGUAGE_LABELS[targetLanguage];

  const userPrompt = `Aşağıdaki Türkçe emlak ilan metnini ${languageName} diline çevir:

"""
${originalText}
"""

JSON formatında döndür.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: TRANSLATE_SYSTEM_PROMPT }],
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
    console.error("Gemini translate API error:", errorData);
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
    if (!parsed.translated) {
      throw new Error("Yanıtta 'translated' alanı bulunamadı");
    }
    return parsed.translated;
  } catch {
    console.error("Translate JSON parse hatası:", cleanedText);
    throw new Error("Çeviri yanıtı beklenen formatta değil, lütfen tekrar deneyin");
  }
}
