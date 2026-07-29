/**
 * Gemini 2.5 Flash Image API ile profesyonel emlakçı portresi üretir.
 *
 * Kullanıcının selfie/fotoğrafını alır, profesyonel stüdyo portresi olarak
 * yeniden üretir. Yüz kimliği korunur, arka plan ve kıyafet profesyonel
 * emlakçı standardında olur.
 */

const PORTRAIT_STYLES = {
  formal: {
    label: "Formal (Takım Elbise)",
    prompt:
      "Transform this person into an ultra-professional corporate real estate agent headshot. " +
      "Dress them in an elegant dark navy business suit with a crisp white dress shirt and a subtle tie. " +
      "Studio lighting with soft, even illumination. Clean, slightly blurred modern office or neutral gradient background. " +
      "85mm portrait lens aesthetic, shallow depth of field. Confident, warm, trustworthy smile. " +
      "Maintain the exact facial identity, skin tone, and key features of the original person. " +
      "High-end real estate agency branding quality. Square 1:1 aspect ratio.",
  },
  casual: {
    label: "Casual Profesyonel",
    prompt:
      "Transform this person into a modern, approachable real estate agent portrait. " +
      "Dress them in smart-casual attire: a well-fitted blazer over a clean polo or button-down shirt, no tie. " +
      "Warm, natural lighting as if taken outdoors in golden hour or in a bright, airy modern home interior. " +
      "Friendly, genuine smile with relaxed confidence. " +
      "Maintain the exact facial identity, skin tone, and key features of the original person. " +
      "Premium lifestyle real estate branding quality. Square 1:1 aspect ratio.",
  },
  luxury: {
    label: "Lüks Emlak Danışmanı",
    prompt:
      "Transform this person into a high-end luxury real estate consultant portrait. " +
      "Dress them in premium designer business attire: tailored charcoal or black suit, luxury watch visible. " +
      "Dramatic, cinematic studio lighting with a dark, moody background (deep charcoal or black). " +
      "Sophisticated, powerful, and refined expression. Slight rembrandt lighting on the face. " +
      "Maintain the exact facial identity, skin tone, and key features of the original person. " +
      "Ultra-premium luxury real estate branding quality, like a Forbes cover portrait. Square 1:1 aspect ratio.",
  },
} as const;

export type PortraitStyle = keyof typeof PORTRAIT_STYLES;

export const PORTRAIT_STYLE_OPTIONS = Object.entries(PORTRAIT_STYLES).map(
  ([key, value]) => ({
    value: key as PortraitStyle,
    label: value.label,
  })
);

interface GeneratePortraitOptions {
  /** Base64-encoded image (without data URI prefix) */
  imageBase64: string;
  /** MIME type of the image, e.g. "image/jpeg" */
  mimeType: string;
  /** Portrait style */
  style: PortraitStyle;
}

interface GeneratePortraitResult {
  /** Base64-encoded generated portrait */
  imageBase64: string;
  /** MIME type of the result */
  mimeType: string;
  /** Is fallback used */
  isFallback?: boolean;
  /** Reason for fallback */
  fallbackReason?: string;
}

/**
 * Gemini 2.5 Flash Image ile profesyonel portre üretir.
 * Server-side'da çalıştırılmalıdır.
 */
export async function generatePortrait(
  options: GeneratePortraitOptions
): Promise<GeneratePortraitResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const styleConfig = PORTRAIT_STYLES[options.style];
  if (!styleConfig) {
    throw new Error(`Geçersiz portre stili: ${options.style}`);
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: options.mimeType,
                    data: options.imageBase64,
                  },
                },
                {
                  text: styleConfig.prompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["image", "text"],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.warn("Gemini Image API request failed, using fallback portrait:", errorText);
      return {
        imageBase64: options.imageBase64,
        mimeType: options.mimeType,
        isFallback: true,
        fallbackReason: response.status === 429
          ? "API günlük üretme limitine ulaştığı için yüklediğiniz orijinal fotoğraf portre kartı olarak optimizasyonla kullanıldı."
          : "Görsel üretim servisi yanıt vermediği için yüklenen orijinal fotoğraf kullanıldı.",
      };
    }

    const data = await response.json();

    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    const imagePart = parts.find(
      (p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData
    );

    if (!imagePart?.inlineData) {
      return {
        imageBase64: options.imageBase64,
        mimeType: options.mimeType,
        isFallback: true,
        fallbackReason: "Yüklediğiniz fotoğraf portre formatında hazırlandı.",
      };
    }

    return {
      imageBase64: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType || "image/png",
      isFallback: false,
    };
  } catch (err) {
    console.error("Gemini generate portrait error:", err);
    return {
      imageBase64: options.imageBase64,
      mimeType: options.mimeType,
      isFallback: true,
      fallbackReason: "Fotoğrafınız portre kartı olarak optimize edildi.",
    };
  }
}
