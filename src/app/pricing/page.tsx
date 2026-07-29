import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Metadata } from "next";
import { PlanCards } from "@/components/pricing/plan-cards";

export const metadata: Metadata = {
  title: "Fiyatlandırma — İlan Asistanı",
  description:
    "İlan Asistanı fiyatlandırma planları. Ücretsiz başlayın, ihtiyacınıza göre büyüyün.",
};

const plans = [
  {
    id: "free" as const,
    name: "Ücretsiz",
    price: "₺0",
    period: "/ay",
    description: "Başlamak için ideal",
    features: [
      { text: "Ayda 5 ilan metni", included: true },
      { text: "3 farklı ton seçeneği", included: true },
      { text: "Kopyalama özelliği", included: true },
      { text: "Geçmiş ilanları görüntüleme", included: true },
      { text: "Sınırsız ilan", included: false },
      { text: "Öncelikli destek", included: false },
      { text: "Ekip erişimi", included: false },
      { text: "Marka özelleştirmesi", included: false },
    ],
    cta: "Ücretsiz Başla",
    popular: false,
  },
  {
    id: "individual" as const,
    name: "Bireysel",
    price: "₺129",
    period: "/ay",
    description: "Aktif emlakçılar için",
    features: [
      { text: "Sınırsız ilan metni", included: true },
      { text: "3 farklı ton seçeneği", included: true },
      { text: "Kopyalama özelliği", included: true },
      { text: "Geçmiş ilanları görüntüleme", included: true },
      { text: "Öncelikli destek", included: true },
      { text: "Sınırsız ilan", included: true },
      { text: "Ekip erişimi", included: false },
      { text: "Marka özelleştirmesi", included: false },
    ],
    cta: "Planı Seç",
    popular: true,
  },
  {
    id: "team" as const,
    name: "Ofis",
    price: "₺449",
    period: "/ay",
    description: "Emlak ofisleri için",
    features: [
      { text: "Sınırsız ilan metni", included: true },
      { text: "3 farklı ton seçeneği", included: true },
      { text: "Kopyalama özelliği", included: true },
      { text: "Geçmiş ilanları görüntüleme", included: true },
      { text: "Öncelikli destek", included: true },
      { text: "Sınırsız ilan", included: true },
      { text: "5 kullanıcıya kadar ekip erişimi", included: true },
      { text: "Ofis logosu / marka özelleştirmesi", included: true },
    ],
    cta: "Planı Seç",
    popular: false,
  },
];

const faqs = [
  {
    q: "Ücretsiz plan neler sunuyor?",
    a: "Ücretsiz plan ile ayda 5 adet ilan metni oluşturabilirsiniz. Her ilan için 3 farklı ton (resmi, samimi, kısa) üretilir. Kredi kartı gerektirmez.",
  },
  {
    q: "Planımı istediğim zaman değiştirebilir miyim?",
    a: "Evet, planınızı istediğiniz zaman yükseltebilir veya düşürebilirsiniz. Yükseltme anında geçerli olur, düşürme mevcut dönem sonunda uygulanır.",
  },
  {
    q: "Ödeme güvenli mi?",
    a: "Evet, tüm ödemeler iyzico altyapısı üzerinden 256-bit SSL şifreleme ile güvenli bir şekilde işlenir. Kart bilgileriniz bizde saklanmaz.",
  },
  {
    q: "İptal edebilir miyim?",
    a: "Evet, aboneliğinizi istediğiniz zaman iptal edebilirsiniz. İptal ettiğinizde mevcut fatura döneminizin sonuna kadar hizmetten yararlanmaya devam edersiniz.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-950 pt-24 pb-20 px-4">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
            Fiyatlandırma
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Size Uygun Planı Seçin
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            Ücretsiz başlayın, ihtiyacınıza göre büyüyün. Tüm planlar 3 farklı ton seçeneği içerir.
          </p>
        </div>

        {/* Dynamic Plan Cards with İyzico Integration */}
        <PlanCards plans={plans} />

        {/* FAQs */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Sıkça Sorulan Sorular
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <Card key={faq.q} className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="pt-5 pb-4">
                  <h3 className="text-white font-medium mb-2">{faq.q}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
