import type { ListingFormData } from "./validation";

export const SYSTEM_PROMPT = `Sen Türkiye emlak piyasasında uzman bir ilan metni yazarısın. Sana verilen mülk bilgilerinden, ilgi çekici ve profesyonel emlak ilan metinleri üretiyorsun.

KURALLAR:
- Sadece verilen bilgileri kullan, uydurma özellik ekleme
- Abartılı/yanıltıcı ifadelerden kaçın
- Türkçe emlak ilanlarındaki doğal dili kullan, ama daha profesyonel bir tonda
- "Samimi" ton bile olsa, gerçek bir emlakçının müşteriyle konuşurken kullanacağı ölçülü bir sıcaklıkta kal. Aşırı duygusal ifadelerden ("birlikte gezelim", "sizi bekliyor" gibi) kaçın; sıcaklığı kelime seçiminde ve ritimde ver, romantikleştirme yapma
- Mülk tipine göre alakalı olmayan alanlardan bahsetme (örn. arsa için "asansör" veya "oda sayısı" gibi kavramlar kullanma; sadece o mülk tipine mantıklı gelen bilgileri işle)
- Metrekare, oda sayısı gibi teknik bilgileri akıcı cümlelere göm, liste gibi sıralama
- İlan türü (Satılık/Kiralık/Devren) bilgisini metnin başına veya doğal bir şekilde akışa dahil et
- Telefon numarası verilmişse, her ilanın sonunda net bir iletişim çağrısı yap (örn. "Detaylı bilgi ve randevu için 0532 XXX XX XX numaralı hattan ulaşabilirsiniz."). Numara verilmemişse genel bir "iletişime geçin" ifadesiyle yetin, numara uydurma
- Yakın çevre olanakları verilmişse bunları doğal bir şekilde metnin içine yedirerek yaz (örn. "Okula ve AVM'ye yürüme mesafesinde")
- Eşya durumu, kredi uygunluğu, takas, site bilgisi gibi ek detaylar verilmişse bunları ilana dahil et
- Emoji kullanma

ÇIKTI FORMATI:
Yalnızca istenen JSON formatında yanıt ver, başka hiçbir açıklama ekleme, markdown kod bloğu kullanma:
{"resmi": "...", "samimi": "...", "kisa": "..."}`;

export function buildUserPrompt(data: ListingFormData): string {
  let prompt = `Aşağıdaki mülk bilgilerinden 3 farklı tonda ilan metni üret:

Mülk Tipi: ${data.propertyType}
`;

  if (data.ilanTuru) prompt += `İlan Türü: ${data.ilanTuru}\n`;

  prompt += `Konum: ${data.location.il}, ${data.location.ilce}${data.location.mahalle ? `, ${data.location.mahalle}` : ""}\n`;

  // Mülk tipine göre dinamik alanlar
  if (data.propertyType === "Daire" || data.propertyType === "Villa") {
    const netM2 = data.metrekareNet ?? data.metpirlareNet;
    if (netM2) prompt += `Net Metrekare: ${netM2} m²\n`;
    if (data.metrekareBrut) prompt += `Brüt Metrekare: ${data.metrekareBrut} m²\n`;
    if (data.odaSayisi) prompt += `Oda Sayısı: ${data.odaSayisi}\n`;
    if (data.banyoSayisi) prompt += `Banyo Sayısı: ${data.banyoSayisi}\n`;
    if (data.bulunduguKat) prompt += `Bulunduğu Kat: ${data.bulunduguKat}\n`;
    if (data.katSayisi) prompt += `Toplam Kat Sayısı: ${data.katSayisi}\n`;
    if (data.binaYasi) prompt += `Bina Yaşı: ${data.binaYasi}\n`;
    if (data.isitmaTipi) prompt += `Isıtma Tipi: ${data.isitmaTipi}\n`;
    if (data.aidat) prompt += `Aidat: ${data.aidat} TL/ay\n`;
    if (data.ozellikler && data.ozellikler.length > 0) {
      prompt += `Özellikler: ${data.ozellikler.join(", ")}\n`;
    }
  } else if (data.propertyType === "Arsa") {
    if (data.alan) prompt += `Alan: ${data.alan} m²\n`;
    if (data.imarDurumu) prompt += `İmar Durumu: ${data.imarDurumu}\n`;
    if (data.cepheBilgisi) prompt += `Cephe Bilgisi: ${data.cepheBilgisi}\n`;
    if (data.altyapi && data.altyapi.length > 0) {
      prompt += `Altyapı: ${data.altyapi.join(", ")}\n`;
    }
    if (data.tapuDurumu) prompt += `Tapu Durumu: ${data.tapuDurumu}\n`;
  } else if (data.propertyType === "İşyeri") {
    if (data.metrekare) prompt += `Metrekare: ${data.metrekare} m²\n`;
    if (data.katPlaza) prompt += `Kat / Plaza Bilgisi: ${data.katPlaza}\n`;
    if (data.kiraSatis) prompt += `Tür: ${data.kiraSatis}\n`;
    if (data.duzen) prompt += `Düzen: ${data.duzen}\n`;
  }

  // Ortak durum bilgileri
  if (data.cepheYonu) prompt += `Cephe Yönü: ${data.cepheYonu}\n`;
  if (data.yapıDurumu) prompt += `Yapı Durumu: ${data.yapıDurumu}\n`;
  if (data.esyaDurumu) prompt += `Eşya Durumu: ${data.esyaDurumu}\n`;
  if (data.krediyeUygun) prompt += `Krediye Uygunluk: ${data.krediyeUygun}\n`;
  if (data.takasaAcik) prompt += `Takasa Açık: ${data.takasaAcik}\n`;
  if (data.siteIcinde) prompt += `Site İçinde: ${data.siteIcinde}\n`;

  // Yakın çevre olanakları
  if (data.yakinCevre && data.yakinCevre.length > 0) {
    prompt += `Yakın Çevre Olanakları: ${data.yakinCevre.join(", ")}\n`;
  }

  prompt += `Fiyat: ${data.price} TL\n`;

  if (data.notes) {
    prompt += `Ek Notlar: ${data.notes}\n`;
  }

  // İletişim bilgisi
  if (data.contactPhone || data.contactName) {
    let contact = "İletişim:";
    if (data.contactPhone) contact += ` ${data.contactPhone}`;
    if (data.contactName) contact += ` (${data.contactName}`;
    if (data.officeName) contact += `, ${data.officeName}`;
    if (data.contactName) contact += `)`;
    prompt += `${contact}\n`;
  }

  prompt += `
TONLAR:
1. "resmi": Kurumsal emlak ofisi dili, 80-120 kelime
2. "samimi": Sıcak, davetkar dil, 80-120 kelime
3. "kisa": Sosyal medya için öz versiyon, max 40 kelime`;

  return prompt;
}
