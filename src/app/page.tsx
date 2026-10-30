import Link from "next/link";
import { ArrowDown, ArrowRight, Check, FileText, Layers3, MousePointer2, Sparkles } from "lucide-react";
import { ListingDemo } from "@/components/listing-demo";
import styles from "./landing.module.css";

const steps = [
  { number: "01", icon: FileText, title: "Mülkünüzü anlatın", description: "Konum, oda sayısı ve öne çıkan özellikleri ekleyin. Kısa notlar yeterli." },
  { number: "02", icon: Sparkles, title: "Kelimeleri bize bırakın", description: "Yapay zeka, mülk bilgilerinizi resmi, samimi ve kısa ilan metinlerine dönüştürsün." },
  { number: "03", icon: MousePointer2, title: "Seçin, kopyalayın, paylaşın", description: "Size uygun metni seçin. İlan platformlarında veya sosyal medyada kullanın." },
];
const plans = [
  { name: "Ücretsiz", price: "0", description: "İlk ilanınızla tanışalım.", features: ["Ayda 5 ilan metni", "3 farklı anlatım tonu", "İlan geçmişi ve kopyalama"], featured: false },
  { name: "Bireysel", price: "129", description: "Her gün yeni portföyler için.", features: ["Sınırsız ilan metni", "3 farklı anlatım tonu", "İlan geçmişi ve kopyalama", "Öncelikli destek"], featured: true },
  { name: "Ofis", price: "449", description: "Birlikte çalışan ekipler için.", features: ["Bireysel plandaki her şey", "5 kullanıcıya kadar ekip erişimi", "Ofis logosu ve marka özelleştirmesi"], featured: false },
];

export default function LandingPage() {
  return (
    <div className={styles.landing}>
      <section className={styles.container + " " + styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}><span className={styles.statusDot} /> EMLAK PROFESYONELLERİ İÇİN</div>
          <h1>Emlak İlan Metninizi <em>Saniyeler İçinde</em> Oluşturun</h1>
          <p className={styles.heroDescription}>Her mülkün bir hikâyesi var. Mülk bilgilerinizi etkileyici ilan metinlerine dönüştürün; zamanınız size ve müşterilerinize kalsın.</p>
          <div className={styles.heroActions}>
            <Link href="/auth" className={styles.primaryLink}>Ücretsiz Dene <ArrowRight size={18} /></Link>
            <a href="#nasil-calisir" className={styles.textLink}>Nasıl çalışır? <ArrowDown size={16} /></a>
          </div>
          <div className={styles.reassurance}><Check size={15} /> Kredi kartı gerekmez <span /> Ayda 5 ilan ücretsiz</div>
          <div className={styles.heroNote}><span>DAHA AZ YAZI YAZIN.</span><strong>Daha çok bağlantı kurun.</strong></div>
        </div>
        <div className={styles.previewWrap}>
          <div className={styles.previewLabel}><Layers3 size={15} /> Birkaç bilgi. Üç farklı anlatım.</div>
          <ListingDemo />
          <p className={styles.previewCaption}>Örnek mülk verileriyle hazırlanmıştır. Tonları değiştirmeyi deneyin.</p>
        </div>
      </section>
      <div className={styles.factsBand}>
        <div className={styles.container + " " + styles.facts}>
          <div><strong>3 farklı ton</strong><span>Her platforma uygun anlatım</span></div>
          <div><strong>Tek bir çalışma alanı</strong><span>İlanlarınız ve sosyal medya içerikleriniz</span></div>
          <div><strong>Kontrol sizde</strong><span>Seçin, düzenleyin ve paylaşın</span></div>
        </div>
      </div>
      <section id="nasil-calisir" className={styles.container + " " + styles.section}>
        <div className={styles.sectionHeading}>
          <div><span className={styles.eyebrow}>DAHA AKICI BİR İŞ GÜNÜ</span><h2>İyi bir ilan, düşündüğünüzden<br />daha yakında.</h2></div>
          <p>Boş bir sayfayla vakit kaybetmeyin.<br />Üç basit adımda yayına hazır olun.</p>
        </div>
        <div className={styles.steps}>
          {steps.map(({ number, icon: Icon, title, description }) => (
            <article key={number} className={styles.step}>
              <div className={styles.stepTop}><Icon size={23} strokeWidth={1.4} /><span>{number}</span></div>
              <h3>{title}</h3><p>{description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className={styles.container + " " + styles.socialSection}>
        <div className={styles.socialArtwork} aria-hidden="true">
          <div className={styles.socialCard}><div className={styles.architecture}><div /><div /><div /></div><span>PORTFÖYÜNÜZÜN YENİ YÜZÜ</span><strong>Yeni bir ev.<br />Yeni bir hikâye.</strong><div className={styles.socialCardBottom}>İLAN ASİSTANI <ArrowRight size={18} /></div></div>
          <div className={styles.socialStamp}><Layers3 size={18} /><div>Bir portföy.<br /><strong>Birden fazla hikâye.</strong></div></div>
        </div>
        <div className={styles.socialCopy}><span className={styles.eyebrow}>PORTFÖYÜNÜZ, HER PLATFORMDA</span><h2>Sadece ilan değil,<br /><em>iyi bir ilk izlenim.</em></h2><p>Mülk fotoğraflarınızı ve profesyonel portrenizi bir araya getirin. Sahibinden.com, Instagram ve Facebook için markanıza uygun görsel kartlar ve hazır ilan metinleri hazırlayın.</p><Link href="/dashboard/instagram" className={styles.textLink}>Sosyal medya stüdyosunu keşfet <ArrowRight size={17} /></Link></div>
      </section>
      <section id="fiyatlandirma" className={styles.container + " " + styles.section}>
        <div className={styles.pricingHeading}><span className={styles.eyebrow}>İŞİNİZE UYGUN BİR PLAN</span><h2>Küçük başlayın.<br /><em>Portföyünüzle birlikte büyüyün.</em></h2><p>İlk adım ücretsiz. İhtiyaçlarınız değiştikçe planınız da değişsin.</p></div>
        <div className={styles.plans}>
          {plans.map((plan) => (
            <article key={plan.name} className={styles.plan + (plan.featured ? " " + styles.featuredPlan : "")}>
              <div className={styles.planName}><h3>{plan.name}</h3>{plan.featured && <span>ÖNERİLEN</span>}</div>
              <p>{plan.description}</p><div className={styles.price}><span>₺</span>{plan.price}<small>/ ay</small></div>
              <Link href={plan.name === "Ücretsiz" ? "/auth" : "/pricing"} className={plan.featured ? styles.primaryLink : styles.outlineLink}>{plan.name === "Ücretsiz" ? "Ücretsiz başla" : "Planı incele"}<ArrowRight size={16} /></Link>
              <ul>{plan.features.map((feature) => <li key={feature}><Check size={16} />{feature}</li>)}</ul>
            </article>
          ))}
        </div>
        <Link href="/pricing" className={styles.compareLink}>Tüm planları karşılaştır <ArrowRight size={15} /></Link>
      </section>
      <section className={styles.container + " " + styles.finalCta}><span className={styles.eyebrow}>SIRADAKİ İLANINIZLA BAŞLAYIN</span><h2>Doğru kelimeler,<br /><em>yeni kapılar açar.</em></h2><Link href="/auth" className={styles.primaryLink}>İlk ilanımı oluştur <ArrowRight size={18} /></Link><p>Ayda 5 ilan ücretsiz. Kredi kartı gerekmez.</p></section>
    </div>
  );
}
