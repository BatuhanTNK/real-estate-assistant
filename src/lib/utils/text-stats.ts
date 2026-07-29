/**
 * Metin istatistikleri ve SEO analizi.
 * Client-side hesaplama — ek API çağrısı gerektirmez.
 */

export interface TextStatsResult {
  /** Kelime sayısı */
  wordCount: number;
  /** Karakter sayısı (boşluksuz) */
  charCount: number;
  /** Karakter sayısı (boşluklu) */
  charCountWithSpaces: number;
  /** Cümle sayısı */
  sentenceCount: number;
  /** Ortalama kelime uzunluğu */
  avgWordLength: number;
  /** Tahmini okuma süresi (saniye) */
  readingTimeSeconds: number;
  /** Okunabilirlik seviyesi (1-100) */
  readabilityScore: number;
  /** Okunabilirlik etiketi */
  readabilityLabel: string;
  /** Platform uyumluluk kontrolleri */
  platformChecks: PlatformCheck[];
}

export interface PlatformCheck {
  platform: string;
  maxChars: number;
  currentChars: number;
  isOk: boolean;
  icon: string;
}

// Türkçe için yaklaşık okuma hızı: 180 kelime/dakika
const TURKISH_WPM = 180;

/**
 * Türkçe metin için basit okunabilirlik skoru.
 * Flesch-Kincaid'in Türkçe adaptasyonu:
 * - Kısa cümleler + kısa kelimeler = yüksek okunabilirlik
 */
function calculateReadability(text: string): { score: number; label: string } {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter((w) => w.length > 0);

  if (words.length === 0 || sentences.length === 0) {
    return { score: 0, label: "—" };
  }

  const avgSentenceLength = words.length / sentences.length;
  const avgWordLength =
    words.reduce((sum, w) => sum + w.replace(/[^\p{L}]/gu, "").length, 0) /
    words.length;

  // Basit skor: kısa cümleler ve kısa kelimeler yüksek skor alır
  const score = Math.max(
    0,
    Math.min(100, Math.round(206.835 - 1.3 * avgSentenceLength - 60.1 * (avgWordLength / 5)))
  );

  let label: string;
  if (score >= 80) label = "Çok Kolay";
  else if (score >= 65) label = "Kolay";
  else if (score >= 50) label = "Orta";
  else if (score >= 35) label = "Zor";
  else label = "Çok Zor";

  return { score, label };
}

/**
 * Platform karakter limitleri kontrolü
 */
function checkPlatforms(charCount: number): PlatformCheck[] {
  return [
    {
      platform: "Sahibinden",
      maxChars: 4000,
      currentChars: charCount,
      isOk: charCount <= 4000,
      icon: "🏠",
    },
    {
      platform: "Hepsiemlak",
      maxChars: 3000,
      currentChars: charCount,
      isOk: charCount <= 3000,
      icon: "🏡",
    },
    {
      platform: "Instagram",
      maxChars: 2200,
      currentChars: charCount,
      isOk: charCount <= 2200,
      icon: "📸",
    },
    {
      platform: "Twitter/X",
      maxChars: 280,
      currentChars: charCount,
      isOk: charCount <= 280,
      icon: "🐦",
    },
  ];
}

/**
 * Verilen metin için tüm istatistikleri hesaplar.
 */
export function analyzeText(text: string): TextStatsResult {
  const trimmed = text.trim();

  if (!trimmed) {
    return {
      wordCount: 0,
      charCount: 0,
      charCountWithSpaces: 0,
      sentenceCount: 0,
      avgWordLength: 0,
      readingTimeSeconds: 0,
      readabilityScore: 0,
      readabilityLabel: "—",
      platformChecks: checkPlatforms(0),
    };
  }

  const words = trimmed.split(/\s+/).filter((w) => w.length > 0);
  const sentences = trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const charCount = trimmed.replace(/\s/g, "").length;
  const charCountWithSpaces = trimmed.length;
  const avgWordLength =
    words.length > 0
      ? words.reduce((sum, w) => sum + w.replace(/[^\p{L}]/gu, "").length, 0) /
        words.length
      : 0;

  const readingTimeSeconds = Math.ceil((words.length / TURKISH_WPM) * 60);
  const { score, label } = calculateReadability(trimmed);

  return {
    wordCount: words.length,
    charCount,
    charCountWithSpaces,
    sentenceCount: sentences.length,
    avgWordLength: Math.round(avgWordLength * 10) / 10,
    readingTimeSeconds,
    readabilityScore: score,
    readabilityLabel: label,
    platformChecks: checkPlatforms(charCountWithSpaces),
  };
}
