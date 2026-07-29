import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <Logo size="md" />
            </div>
            <p className="text-slate-400 text-sm max-w-md leading-relaxed">
              Yapay zeka destekli emlak ilan metni oluşturma aracı. Mülk bilgilerinizi girin, 
              saniyeler içinde profesyonel ilan metinleri alın.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Ürün</h4>
            <ul className="space-y-2">
              <li>
                <a href="#nasil-calisir" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Nasıl Çalışır?
                </a>
              </li>
              <li>
                <Link href="/pricing" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Fiyatlandırma
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Destek</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/legal/contact" className="text-slate-400 hover:text-white transition-colors text-sm">
                  İletişim
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Kullanım Şartları
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-8 pt-8 text-center">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} İlan Asistanı. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
}
