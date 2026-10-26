"use client";

import { useRef, useState } from "react";
import { Check, Copy, MapPin, Sparkles } from "lucide-react";
import styles from "@/app/landing.module.css";

const examples = {
  resmi: { label: "Resmi", title: "Caferağa’da manzaralı bir yaşam", text: "Kadıköy’ün Caferağa mahallesinde yer alan bu 3+1 daire, 120 m² kullanım alanı ve deniz manzarasıyla öne çıkıyor. Beşinci katta konumlanan mülk; asansör ve otopark olanaklarıyla merkezi bir yaşam sunuyor." },
  samimi: { label: "Samimi", title: "Kadıköy’de yeni bir başlangıç", text: "Güne deniz manzarasıyla başlamaya ne dersiniz? Caferağa’daki bu ferah 3+1 daire, 120 m² yaşam alanıyla sizi bekliyor. Beşinci katta, üstelik asansörü ve otoparkı da var. Kadıköy’ün keyfini kendi evinizde çıkarın." },
  kisa: { label: "Kısa", title: "Caferağa’da deniz manzaralı 3+1", text: "Kadıköy Caferağa’da 120 m², 3+1 daire. 5. kat, deniz manzarası, asansör ve otopark. Satış fiyatı: 4.500.000 TL." },
};

export function ListingDemo() {
  const [tone, setTone] = useState<keyof typeof examples>("resmi");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const copyRequest = useRef(0);
  const example = examples[tone];
  async function copyExample() {
    const request = ++copyRequest.current;
    try {
      await navigator.clipboard.writeText(example.title + "\n\n" + example.text);
      if (request === copyRequest.current) setCopyState("copied");
    } catch { if (request === copyRequest.current) setCopyState("error"); }
  }
  return (
    <div className={styles.demo}>
      <div className={styles.demoToolbar}><span><span className={styles.statusDot} /> İlan çalışma alanı</span><span>ÖRNEK</span></div>
      <div className={styles.propertyBrief}>
        <div className={styles.demoKicker}>MÜLK BİLGİLERİ</div>
        <div className={styles.propertyLocation}><MapPin size={15} /> Kadıköy, Caferağa</div>
        <dl className={styles.propertyFacts}><div><dt>Oda</dt><dd>3+1</dd></div><div><dt>Alan</dt><dd>120 m²</dd></div><div><dt>Fiyat</dt><dd>₺4.500.000</dd></div></dl>
        <div className={styles.propertyTags}><span>Deniz manzarası</span><span>Asansör</span><span>Otopark</span></div>
      </div>
      <div className={styles.generationDivider}><span /><Sparkles size={15} /><span /></div>
      <div className={styles.demoOutput}>
        <div className={styles.demoOutputHeader}><span className={styles.demoKicker}>İLAN METNİNİZ</span><span className={styles.ready}><Check size={12} /> Hazır</span></div>
        <div className={styles.toneGroup} role="group" aria-label="Örnek ilan tonu">
          {(Object.keys(examples) as Array<keyof typeof examples>).map((key) => <button key={key} type="button" aria-pressed={tone === key} onClick={() => { copyRequest.current++; setTone(key); setCopyState("idle"); }} className={tone === key ? styles.activeTone : ""}>{examples[key].label}</button>)}
        </div>
        <div className={styles.exampleText} aria-live="polite"><h2>{example.title}</h2><p>{example.text}</p></div>
        <div className={styles.outputFooter}><span aria-live="polite">{copyState === "error" ? "Kopyalanamadı. Metni seçerek kopyalayabilirsiniz." : "Mülkünüzün hikâyesi, sizin tonunuzda."}</span><button type="button" onClick={copyExample} aria-label={copyState === "copied" ? "Metin kopyalandı" : "Örnek metni kopyala"}>{copyState === "copied" ? <Check size={15} /> : <Copy size={15} />}{copyState === "copied" ? "Kopyalandı" : "Kopyala"}</button></div>
      </div>
    </div>
  );
}
