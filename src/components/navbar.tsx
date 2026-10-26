"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/logo";
import { ArrowRight, LogOut, Menu, Plus, X } from "lucide-react";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js";

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => { if (active) setUser(data?.user ?? null); }).catch(() => {});
    const { data } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => { if (active) setUser(session?.user ?? null); });
    return () => { active = false; data?.subscription?.unsubscribe(); };
  }, [supabase]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) setMobileMenuOpen(false);
    };
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = (event: MediaQueryListEvent) => { if (event.matches) setMobileMenuOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOutside);
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOutside);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, [mobileMenuOpen]);

  async function handleSignOut() {
    setSignOutError("");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setMobileMenuOpen(false);
      router.replace("/");
      router.refresh();
    } catch {
      setSignOutError("Çıkış yapılamadı. Bağlantınızı kontrol edip tekrar deneyin.");
    }
  }
  if (pathname === "/auth") return null;
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Hesabım";
  const closeMenu = () => setMobileMenuOpen(false);
  const navigation = <>
    <Link href="/#nasil-calisir" onClick={closeMenu} className="site-nav-link">Nasıl çalışır?</Link>
    <Link href="/pricing" onClick={closeMenu} className="site-nav-link" aria-current={pathname === "/pricing" ? "page" : undefined}>Fiyatlandırma</Link>
    {user && <Link href="/dashboard" onClick={closeMenu} className="site-nav-link">Çalışma alanım</Link>}
  </>;
  const account = user ? <>
    <Link href="/dashboard/new" onClick={closeMenu} className="site-nav-cta"><Plus size={15} /> Yeni ilan</Link>
    <Link href="/dashboard/settings" onClick={closeMenu} className="site-profile" title={displayName}><span>{displayName[0].toUpperCase()}</span><span>{displayName}</span></Link>
    <button type="button" onClick={handleSignOut} className="site-nav-link site-signout" aria-label="Çıkış yap"><LogOut size={17} /></button>
  </> : <>
    <Link href="/auth" onClick={closeMenu} className="site-nav-link">Giriş Yap</Link>
    <Link href="/auth" onClick={closeMenu} className="site-nav-cta">Ücretsiz Dene <ArrowRight size={15} /></Link>
  </>;

  return <header className="site-header" ref={headerRef}>
    <div className="site-header-inner">
      <Logo onClick={closeMenu} />
      <nav className="site-desktop-nav" aria-label="Ana gezinme">{navigation}</nav>
      <div className="site-desktop-account">{account}</div>
      <button ref={toggleRef} type="button" className="site-menu-toggle" aria-label={mobileMenuOpen ? "Menüyü kapat" : "Menüyü aç"} aria-expanded={mobileMenuOpen} aria-controls={mobileMenuOpen ? "mobile-navigation" : undefined} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}</button>
    </div>
    {mobileMenuOpen && <nav id="mobile-navigation" className="site-mobile-nav" aria-label="Mobil gezinme">{navigation}<div className="site-mobile-account">{account}</div></nav>}
    {signOutError && <p role="alert" className="mx-auto max-w-6xl px-6 pb-3 text-sm text-red-300">{signOutError}</p>}
  </header>;
}
