/**
 * Türk Lirası formatlaması
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Tarih formatlaması (Türkçe) — deterministic
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const months = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Kısa tarih formatlaması — deterministic (GG.AA.YYYY)
 */
export function formatDateShort(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Property type label mapping
 */
export function normalizePropertyType(type: string): string {
  return type.trim().toLocaleLowerCase("tr-TR").normalize("NFD").replace(/\p{M}/gu, "").replace(/ı/g, "i");
}

export function getPropertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    daire: "Daire",
    villa: "Villa",
    arsa: "Arsa",
    isyeri: "İşyeri",
    diger: "Diğer",
  };
  return labels[normalizePropertyType(type)] || type;
}
