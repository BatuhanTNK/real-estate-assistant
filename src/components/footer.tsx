import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function Footer() {
  return <footer className="site-footer">
    <div className="site-footer-main">
      <div className="site-footer-brand"><Logo /><p>Her mülkün bir hikâyesi var.<br />Doğru kelimeleri birlikte bulalım.</p></div>
      <div><h2>Keşfedin</h2><Link href="/#nasil-calisir">Nasıl çalışır?</Link><Link href="/pricing">Fiyatlandırma</Link><Link href="/dashboard/instagram">Instagram stüdyosu</Link></div>
      <div><h2>İletişimde kalalım</h2><Link href="/legal/contact">İletişim</Link><Link href="/legal/privacy">Gizlilik Politikası</Link><Link href="/legal/terms">Kullanım Şartları</Link></div>
    </div>
    <div className="site-footer-bottom"><p>© {new Date().getFullYear()} İlan Asistanı. Tüm hakları saklıdır.</p><span>Emlak profesyonelleri için tasarlandı.</span></div>
  </footer>;
}
