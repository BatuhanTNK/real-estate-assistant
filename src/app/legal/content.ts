import type { Metadata } from "next";

export type LegalDocId = "contact" | "privacy" | "terms";

export type LegalDocSection = {
  heading: string;
  body: string[];
};

export type LegalDoc = {
  id: LegalDocId;
  title: string;
  description: string;
  lastUpdated: string;
  sections: LegalDocSection[];
};

/**
 * Statik hukuki/iletişim içerikleri. Footer'dan `/legal/[type]` ile
 * sunulur. İçerik projeye gömülüdür; MVP için yeterli bir yer tutucudur
 * ve gerçek metin avukat tarafından gözden geçirilmelidir.
 */
export const legalDocs: Record<LegalDocId, LegalDoc> = {
  contact: {
    id: "contact",
    title: "İletişim",
    description: "Bizimle iletişime geçin — sorularınızı yanıtlamaktan memnuniyet duyarız.",
    lastUpdated: "27 Temmuz 2026",
    sections: [
      {
        heading: "Destek",
        body: [
          "İlan Asistanı hakkında sorularınız, geri bildirimleriniz veya önerileriniz için bizimle iletişime geçebilirsiniz.",
          "Genelde 1–2 iş günü içinde yanıt veriyoruz.",
        ],
      },
      {
        heading: "E-posta",
        body: [
          "destek@ilanasistani.com adresine e-posta gönderebilirsiniz.",
          "Abonelik, faturalandırma veya teknik sorunlar için aynı adresi kullanabilirsiniz.",
        ],
      },
      {
        heading: "İş Saatleri",
        body: [
          "Pazartesi – Cuma: 09:00 – 18:00 (TSI)",
          "Hafta sonu ve resmi tatillerde sınırlı destek sağlanır.",
        ],
      },
    ],
  },
  privacy: {
    id: "privacy",
    title: "Gizlilik Politikası",
    description:
      "İlan Asistanı olarak gizliliğinize saygı duyuyoruz. Bu politika verilerinizi nasıl topladığımızı ve koruduğumuzu açıklar.",
    lastUpdated: "27 Temmuz 2026",
    sections: [
      {
        heading: "1. Toplanan Bilgiler",
        body: [
          "Hesap oluştururken ad-soyad, e-posta adresi ve telefon bilgilerinizi toplarız.",
          "Hizmeti kullanırken girdiğiniz mülk bilgileri ve oluşturulan ilan metinleri hesabınızla ilişkilendirilir.",
          "Kullanım analizlerini (sayfa görüntülemeleri, özellik kullanımı) hizmeti iyileştirmek için toplarız.",
        ],
      },
      {
        heading: "2. Bilgilerin Kullanımı",
        body: [
          "Topladığımız bilgileri hizmeti sunmak, hesabınızı yönetmek ve ürünü geliştirmek için kullanırız.",
          "Bilgilerinizi üçüncü taraflara satmıyoruz.",
          "Yasal yükümlülükler dışında kişisel verilerinizi paylaşmıyoruz.",
        ],
      },
      {
        heading: "3. Veri Güvenliği",
        body: [
          "Verileriniz Supabase altyapısında saklanır ve endüstri standardı şifreleme yöntemleriyle korunur.",
          "Şifreler tek yönlü hash olarak saklanır; kimse — biz de dahil — düz metin olarak göremez.",
        ],
      },
      {
        heading: "4. Haklarınız",
        body: [
          "Kişisel verilerinize erişme, düzeltme veya silme hakkına sahipsiniz.",
          "Bu hakları kullanmak için destek adresimize yazabilirsiniz.",
        ],
      },
      {
        heading: "5. İletişim",
        body: [
          "Bu politika hakkında sorularınız için destek@ilanasistani.com adresine yazabilirsiniz.",
        ],
      },
    ],
  },
  terms: {
    id: "terms",
    title: "Kullanım Şartları",
    description:
      "Hizmetimizi kullanırken kabul ettiğiniz şartları aşağıda bulabilirsiniz. Lütfen dikkatlice okuyun.",
    lastUpdated: "27 Temmuz 2026",
    sections: [
      {
        heading: "1. Kabul",
        body: [
          "Hizmetimizi kullanarak bu şartları kabul etmiş olursunuz.",
          "Şartları kabul etmiyorsanız hizmeti kullanmamanız gerekir.",
        ],
      },
      {
        heading: "2. Hizmetin Kullanımı",
        body: [
          "Yapay zekâ tarafından oluşturulan ilan metinleri bilgilendirme amaçlıdır; doğruluğunu kullanmadan önce teyit etmelisiniz.",
          "Hizmeti yasa dışı, zarar verici veya kötüye kullanım amacıyla kullanamazsınız.",
          "Her hesabın tek bir kullanıcı tarafından kullanılması beklenir; kimlik bilgilerinizi paylaşmamalısınız.",
        ],
      },
      {
        heading: "3. Abonelik ve Ödeme",
        body: [
          "Ücretli planlar aylık olarak faturalandırılır.",
          "Aboneliğiniz iptal edene kadar yenilenir; iptalden sonra mevcut dönem sonuna kadar erişiminiz devam eder.",
        ],
      },
      {
        heading: "4. Sorumluluğun Sınırlandırılması",
        body: [
          "Hizmet 'olduğu gibi' sunulur ve belirli bir sonuca yönelik garanti vermez.",
          "Oluşturulan içerik mülk veya yasa ile ilgili yanlış bilgiler içerebilir; sorumluluk kullanıcıya aittir.",
        ],
      },
      {
        heading: "5. Değişiklikler",
        body: [
          "Şartları önceden haber vererek değiştirme hakkımız saklıdır.",
          "Önemli değişiklikleri e-posta veya hizmet içi bildirimle duyururuz.",
        ],
      },
      {
        heading: "6. İletişim",
        body: [
          "Şartlar hakkında sorularınız için destek@ilanasistani.com adresine yazabilirsiniz.",
        ],
      },
    ],
  },
};

export const legalDocIds = Object.keys(legalDocs) as LegalDocId[];

export function isLegalDocId(value: string): value is LegalDocId {
  return value in legalDocs;
}

export function legalMetadata(id: LegalDocId): Metadata {
  const doc = legalDocs[id];
  return {
    title: `${doc.title} — İlan Asistanı`,
    description: doc.description,
  };
}
