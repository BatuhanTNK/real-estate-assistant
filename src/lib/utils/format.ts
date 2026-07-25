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
 * Tarih formatlaması (Türkçe)
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

/**
 * Kısa tarih formatlaması
 */
export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}

/**
 * Property type label mapping
 */
export function getPropertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    daire: "Daire",
    villa: "Villa",
    arsa: "Arsa",
    isyeri: "İşyeri",
    diger: "Diğer",
  };
  return labels[type] || type;
}
