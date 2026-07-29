import { z } from "zod";

/**
 * İlan oluşturma formu için sunucu tarafı doğrulama şeması.
 * Frontend'den gelen formData'yı güvenli hale getirir.
 *
 * Bu şema prompts.ts'deki ListingFormData ile uyumludur.
 */

const propertyTypeEnum = z.enum(["Daire", "Villa", "Arsa", "İşyeri", "Diğer"]);
const ilanTuruEnum = z.enum([
  "Satılık",
  "Kiralık",
  "Devren Satılık",
  "Devren Kiralık",
]);

/**
 * Türkiye telefon numarası regex.
 * Kabul edilen: 0532 XXX XX XX, +90 532 ... , 532 XXX XX XX
 * Boşluk/parantez toleransı içerir.
 */
const phoneRegex = /^(\+?90\s?)?0?5\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/;

const phoneSchema = z
  .string()
  .trim()
  .max(32)
  .optional()
  .or(z.literal(""))
  .refine(
    (val) => !val || phoneRegex.test(val.replace(/\s+/g, " ").trim()),
    "Geçersiz telefon numarası formatı"
  );

/**
 * Pozitif sayısal alanlar (metrekare, alan, banyo sayısı vb.) için.
 * Boş string'e izin verilir (opsiyonel alanlar).
 */
const optionalShortText = z
  .string()
  .trim()
  .max(20)
  .optional()
  .or(z.literal(""));

const locationSchema = z.object({
  il: z.string().trim().min(2, "İl gerekli").max(40),
  ilce: z.string().trim().min(2, "İlçe gerekli").max(60),
  mahalle: z.string().trim().max(80).optional().or(z.literal("")),
});

/**
 * Prompt-injection koruması:
 * - Kontrol karakterlerini (ASCII 0x00-0x1F + 0x7F) siler
 * - Unicode harfleri (Türkçe dahil) dokunmaz
 * - Fazla boşluğu sınırlar
 *
 * Not: Gemini'ya girdi her zaman "user" rolünde iletiliyor, systemInstruction
 * ayrı tutuluyor. Bu, enjeksiyon riskini büyük ölçüde azaltır.
 */
const MAX_NOTES_LENGTH = 2000;
const MAX_PRICE_LENGTH = 20;

function sanitizeFreeText(value: string): string {
  return value
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/\s{3,}/g, "  ")
    .trim();
}

const freeTextSchema = (max: number) =>
  z
    .string()
    .max(max, `Maksimum ${max} karakter`)
    .optional()
    .or(z.literal(""))
    .transform((val) => (val ? sanitizeFreeText(val) : ""));

export const listingFormSchema = z.object({
  // Temel
  propertyType: propertyTypeEnum,
  ilanTuru: ilanTuruEnum,

  location: locationSchema,

  // Fiyat: görsel amaçlı serbest metin (örn "15.000 / ay"), kısa tutulur
  price: z.string().trim().min(1, "Fiyat gerekli").max(MAX_PRICE_LENGTH),

  // İletişim
  contactPhone: phoneSchema,

  // Profil kaynaklı (formdan gelmez, route'ta profile'dan eklenir) — opsiyonel
  contactName: z.string().trim().max(100).optional(),
  officeName: z.string().trim().max(100).optional(),

  // Ortak durum bilgileri (opsiyonel)
  yapıDurumu: z.enum(["Sıfır", "İkinci El", "Tadilatlı"]).optional().or(z.literal("")),
  cepheYonu: z.string().trim().max(20).optional().or(z.literal("")),
  esyaDurumu: z.enum(["Eşyalı", "Eşyasız", "Yarı Eşyalı"]).optional().or(z.literal("")),
  krediyeUygun: z.enum(["Evet", "Hayır"]).optional().or(z.literal("")),
  takasaAcik: z.enum(["Evet", "Hayır"]).optional().or(z.literal("")),
  siteIcinde: z.enum(["Evet", "Hayır"]).optional().or(z.literal("")),
  yakinCevre: z.array(z.string().trim().max(40)).max(20).optional().default([]),

  // Daire / Villa
  // NOT: frontend "metpirlareNet" -> "metrekareNet" düzeltildiği için
  // burada doğru ad kabul edilir; eski ad da geriye dönük destek için okunur.
  metrekareNet: optionalShortText.optional(),
  metpirlareNet: optionalShortText.optional(), // geriye dönük uyumluluk
  metrekareBrut: optionalShortText.optional(),
  odaSayisi: z.string().trim().max(10).optional().or(z.literal("")),
  banyoSayisi: optionalShortText.optional(),
  bulunduguKat: z.string().trim().max(20).optional().or(z.literal("")),
  katSayisi: z.string().trim().max(20).optional().or(z.literal("")),
  binaYasi: z.string().trim().max(20).optional().or(z.literal("")),
  isitmaTipi: z.string().trim().max(40).optional().or(z.literal("")),
  aidat: z.string().trim().max(20).optional().or(z.literal("")),
  ozellikler: z.array(z.string().trim().max(40)).max(30).optional().default([]),

  // Arsa
  alan: optionalShortText.optional(),
  imarDurumu: z.string().trim().max(60).optional().or(z.literal("")),
  cepheBilgisi: z.string().trim().max(80).optional().or(z.literal("")),
  altyapi: z.array(z.string().trim().max(40)).max(20).optional().default([]),
  tapuDurumu: z.string().trim().max(60).optional().or(z.literal("")),

  // İşyeri
  metrekare: optionalShortText.optional(),
  katPlaza: z.string().trim().max(80).optional().or(z.literal("")),
  duzen: z.string().trim().max(40).optional().or(z.literal("")),
  kiraSatis: z.string().trim().max(20).optional().or(z.literal("")),

  // Ek notlar — en uzun serbest metin, prompt-injection riski en yüksek
  notes: freeTextSchema(MAX_NOTES_LENGTH),
});

export type ListingFormData = z.infer<typeof listingFormSchema>;

/**
 * Validate request body against schema.
 * Başarısız olursa zod hatasını okunabilir bir nesneye çevirir.
 */
export function validateListingForm(
  raw: unknown
): { ok: true; data: ListingFormData } | { ok: false; error: string } {
  const result = listingFormSchema.safeParse(raw);
  if (result.success) {
    return { ok: true, data: result.data };
  }

  const firstIssue = result.error.issues[0];
  const path = firstIssue?.path.join(".") || "form";
  const message = firstIssue
    ? `${path}: ${firstIssue.message}`
    : "Form verisi geçersiz";

  return { ok: false, error: message };
}
