import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fiyatlandırma — İlan Asistanı",
  description: "İlan Asistanı fiyatlandırma planları. Ücretsiz başlayın, ihtiyacınıza göre büyüyün.",
};

const plans = [
  {
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
    a: "Evet, tüm ödemeler iyzico altyapısı üzerinden güvenli bir şekilde işlenir. Kart bilgileriniz bizde saklanmaz.",
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

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative bg-white/5 border-white/10 backdrop-blur-sm hover:border-white/20 transition-all duration-300 ${
                plan.popular
                  ? "ring-2 ring-indigo-500/50 border-indigo-500/30 scale-[1.02]"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white border-0 px-4">
                    En Popüler
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2 pt-8">
                <CardTitle className="text-white text-lg mb-2">{plan.name}</CardTitle>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-slate-400">{plan.period}</span>
                </div>
                <p className="text-slate-400 text-sm mt-2">{plan.description}</p>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className="flex items-start gap-2 text-sm">
                      {feature.included ? (
                        <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={feature.included ? "text-slate-300" : "text-slate-500"}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link href="/auth" className="block">
                  <Button
                    className={`w-full font-medium ${
                      plan.popular
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-500/20"
                        : "bg-white/10 text-white hover:bg-white/15"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

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
