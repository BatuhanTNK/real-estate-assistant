"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, CreditCard, FilePlus2, Image, LayoutDashboard, Settings2 } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Genel bakış", icon: LayoutDashboard },
  { href: "/dashboard/new", label: "İlan oluştur", icon: FilePlus2 },
  { href: "/dashboard/instagram", label: "Instagram stüdyosu", icon: Image },
  { href: "/dashboard/settings", label: "Hesap ayarları", icon: Settings2 },
];
export function DashboardNavigation() {
  const pathname = usePathname();
  return <aside className="workspace-sidebar">
    <div className="workspace-label">ÇALIŞMA ALANINIZ</div>
    <nav aria-label="Çalışma alanı gezinmesi">{links.map(({ href, label, icon: Icon }) => {
      const active = href === "/dashboard" ? pathname === href || pathname.startsWith("/dashboard/listing/") : pathname.startsWith(href);
      return <Link href={href} key={href} aria-current={active ? "page" : undefined} className={active ? "workspace-link workspace-link-active" : "workspace-link"}><Icon size={17} strokeWidth={1.6} /><span>{label}</span></Link>;
    })}</nav>
    <div className="workspace-upgrade"><CreditCard size={20} strokeWidth={1.4} /><h2>İşinize biraz daha alan açın.</h2><p>Size uygun planı keşfedin, portföyünüze odaklanın.</p><Link href="/pricing">Planları incele <ArrowUpRight size={14} /></Link></div>
  </aside>;
}
