import { SYSTEM_PROMPT } from "./prompts";

interface GeminiResponse {
  resmi: string;
  samimi: string;
  kisa: string;
}

/**
 * Gemini API'ye istek gönderir ve JSON yanıt alır
 */
export async function generateWithGemini(
  userPrompt: string
): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
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
    console.error("Gemini API error:", errorData);
    throw new Error(`Gemini API hatası: ${response.status}`);
  }

  const data = await response.json();

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error("Gemini API boş yanıt döndürdü");
  }

  const text = data.candidates[0].content.parts[0].text;

  // JSON fence stripping (güvenlik katmanı)
  const cleanedText = text
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    const parsed: GeminiResponse = JSON.parse(cleanedText);

    if (!parsed.resmi || !parsed.samimi || !parsed.kisa) {
      throw new Error("Eksik alan: resmi, samimi veya kisa");
    }

    return parsed;
  } catch (parseError) {
    console.error("JSON parse hatası:", cleanedText);
    throw new Error("AI yanıtı beklenen formatta değil, lütfen tekrar deneyin");
  }
}
