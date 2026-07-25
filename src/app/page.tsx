import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const beforeAfterExample = {
  before: `Mülk Tipi: Daire
Konum: İstanbul, Kadıköy, Caferağa
3+1, 120m², 5. kat, asansör, otopark, deniz manzarası
Fiyat: 4.500.000 TL`,
  after: {
    resmi:
      "Kadıköy'ün gözde mahallesi Caferağa'da, İstanbul Boğazı'nın eşsiz manzarasına sahip 120 metrekare net kullanım alanı sunan bu 3+1 daire, 5. katta konumlanmaktadır. Bina bünyesinde asansör ve kapalı otopark imkânı bulunmaktadır. Ulaşım ağlarına yakınlığı ve merkezi konumuyla öne çıkan bu mülk, 4.500.000 TL bedelle satışa sunulmaktadır.",
    samimi:
      "Caferağa'da denize nazır, geniş bir 3+1 arıyorsanız tam yerine geldiniz. 120 metrekarelik bu daire 5. katta ve her odadan manzara var. Asansör ve otopark da cabası. Kadıköy'ün tam kalbinde, her şeye yürüme mesafesinde bir yaşam sizi bekliyor. Fiyat: 4.500.000 TL.",
    kisa:
      "Kadıköy Caferağa'da deniz manzaralı 3+1 daire. 120m², 5. kat, asansör ve otopark mevcut. 4.500.000 TL.",
  },
};

const plans = [
  {
    name: "Ücretsiz",
    price: "₺0",
    period: "/ay",
    description: "Başlamak için ideal",
    features: [
      "Ayda 5 ilan metni",
      "3 farklı ton seçeneği",
      "Kopyalama özelliği",
      "Geçmiş ilanları görüntüleme",
    ],
    cta: "Ücretsiz Başla",
    popular: false,
    gradient: "from-slate-800 to-slate-700",
  },
  {
    name: "Bireysel",
    price: "₺129",
    period: "/ay",
    description: "Aktif emlakçılar için",
    features: [
      "Sınırsız ilan metni",
      "3 farklı ton seçeneği",
      "Kopyalama özelliği",
      "Geçmiş ilanları görüntüleme",
      "Öncelikli destek",
    ],
    cta: "Planı Seç",
    popular: true,
    gradient: "from-indigo-600 to-indigo-500",
  },
  {
    name: "Ofis",
    price: "₺449",
    period: "/ay",
    description: "Emlak ofisleri için",
    features: [
      "Sınırsız ilan metni",
      "5 kullanıcıya kadar ekip erişimi",
      "Ofis logosu / marka özelleştirmesi",
      "3 farklı ton seçeneği",
      "Öncelikli destek",
      "Toplu ilan oluşturma",
    ],
    cta: "Planı Seç",
    popular: false,
    gradient: "from-emerald-600 to-emerald-500",
  },
];

const steps = [
  {
    number: "01",
    title: "Bilgileri Girin",
    description: "Mülk tipini seçin, konum, metrekare, oda sayısı gibi detayları doldurun.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "AI Üretsin",
    description: "Yapay zeka saniyeler içinde 3 farklı tonda profesyonel ilan metni oluşturur.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Kopyala & Paylaş",
    description: "Beğendiğiniz tonu tek tıkla kopyalayın, hemen ilanınızda kullanın.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
      </svg>
    ),
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* ============ HERO ============ */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-indigo-500/8 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/8 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/3 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <Badge className="mb-6 bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-4 py-1.5 text-sm font-medium hover:bg-indigo-500/15 transition-colors">
            Yapay Zeka Destekli
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Emlak İlan Metninizi
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              Saniyeler İçinde
            </span>{" "}
            Oluşturun
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Mülk bilgilerinizi girin, yapay zeka 3 farklı tonda profesyonel ilan metni üretsin. 
            Resmi, samimi ve sosyal medya tonlarında — kopyala ve hemen kullan.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth">
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-8 py-6 text-lg font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-300"
              >
                Ücretsiz Dene
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>
            <a href="#nasil-calisir">
              <Button
                variant="ghost"
                size="lg"
                className="text-slate-400 hover:text-white hover:bg-white/5 px-8 py-6 text-lg"
              >
                Nasıl Çalışır?
              </Button>
            </a>
          </div>

          <p className="text-slate-500 text-sm mt-4">
            Kredi kartı gerektirmez · Ayda 5 ilan ücretsiz
          </p>
        </div>
      </section>

      {/* ============ BEFORE / AFTER ============ */}
      <section className="py-20 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ham Bilgi → Profesyonel İlan
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Sadece mülk bilgilerini girin, gerisini yapay zeka halletsin
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 items-start">
            {/* Before */}
            <div className="relative">
              <div className="absolute -top-3 left-4 z-10">
                <Badge className="bg-slate-700 text-slate-300 border-slate-600">
                  Girdiğiniz Bilgiler
                </Badge>
              </div>
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="pt-8 pb-6">
                  <pre className="text-slate-300 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                    {beforeAfterExample.before}
                  </pre>
                </CardContent>
              </Card>
            </div>

            {/* After */}
            <div className="relative">
              <div className="absolute -top-3 left-4 z-10">
                <Badge className="bg-gradient-to-r from-indigo-600 to-emerald-600 text-white border-0">
                  AI Çıktısı — Resmi Ton
                </Badge>
              </div>
              <Card className="bg-gradient-to-br from-indigo-500/5 to-emerald-500/5 border-indigo-500/20 backdrop-blur-sm">
                <CardContent className="pt-8 pb-6">
                  <p className="text-slate-200 text-sm leading-relaxed">
                    {beforeAfterExample.after.resmi}
                  </p>
                  <Separator className="my-4 bg-white/5" />
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-indigo-400 border-indigo-400/30 text-xs">
                      Resmi
                    </Badge>
                    <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-xs">
                      Samimi
                    </Badge>
                    <Badge variant="outline" className="text-amber-400 border-amber-400/30 text-xs">
                      Kısa
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="nasil-calisir" className="py-20 px-4 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              3 Adımda Profesyonel İlan
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Karmaşık yazım süreçleriyle uğraşmayın, yapay zeka sizin yerinize yazsin
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="group relative">
                <div className="absolute -top-4 -left-2 text-6xl font-black text-white/3 select-none">
                  {step.number}
                </div>
                <Card className="bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/15 transition-all duration-300 backdrop-blur-sm h-full">
                  <CardContent className="pt-8 pb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 rounded-xl flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                      {step.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="fiyatlandirma" className="py-20 px-4 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Size Uygun Planı Seçin
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Ücretsiz başlayın, ihtiyacınıza göre büyüyün
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
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
                <CardContent className="pt-4">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-slate-300">{feature}</span>
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
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 rounded-3xl p-12 border border-white/5 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Hemen Ücretsiz Deneyin
              </h2>
              <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                Kayıt olun, mülk bilgilerinizi girin ve yapay zekanın ürettiği profesyonel ilan metinlerini görün. 
                Kredi kartı gerektirmez.
              </p>
              <Link href="/auth">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-10 py-6 text-lg font-medium shadow-lg shadow-indigo-500/20"
                >
                  Ücretsiz Başla
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
