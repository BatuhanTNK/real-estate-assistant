"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Plus, LogOut, Camera } from "lucide-react";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;
    const getUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (mounted) {
          setUser(data?.user ?? null);
        }
      } catch (err) {
        console.warn("Supabase auth not connected:", err);
      }
    };
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (mounted) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [supabase.auth]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // safe fallback
    }
    window.location.href = "/";
  };

  // Don't show navbar on auth page
  if (pathname === "/auth") return null;

  const isLanding = pathname === "/";
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Profilim";
  const userInitial = (user?.user_metadata?.full_name?.[0] || user?.email?.[0] || "U").toUpperCase();

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-slate-950/80 backdrop-blur-xl border-b border-white/5 shadow-lg"
          : isLanding
          ? "bg-transparent"
          : "bg-slate-950/80 backdrop-blur-xl border-b border-white/5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Logo size="md" />

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-4" suppressHydrationWarning>
            {isLanding && (
              <>
                <a href="#nasil-calisir" className="text-slate-400 hover:text-white transition-colors text-sm mr-2">
                  Nasıl Çalışır?
                </a>
                <a href="#fiyatlandirma" className="text-slate-400 hover:text-white transition-colors text-sm mr-2">
                  Fiyatlandırma
                </a>
              </>
            )}
            {user ? (
              <>
                <Link href="/dashboard/instagram">
                  <Button variant="outline" className="border-indigo-500/30 text-indigo-300 hover:text-white hover:bg-indigo-500/10 flex items-center gap-1.5 text-sm font-medium">
                    <Camera className="w-4 h-4 text-indigo-400" />
                    <span>Instagram Kartı</span>
                  </Button>
                </Link>

                <Link href="/dashboard/new">
                  <Button className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white flex items-center gap-1.5 shadow-md shadow-indigo-500/20 text-sm font-medium">
                    <Plus className="w-4 h-4" />
                    <span>Yeni İlan Oluştur</span>
                  </Button>
                </Link>

                <Link
                  href="/dashboard"
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800 transition-all text-slate-200 hover:text-white group"
                  title="Dashboard / Profil"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                    {userInitial}
                  </div>
                  <span className="text-sm font-medium max-w-[120px] truncate">{displayName}</span>
                </Link>

                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-sm flex items-center gap-1.5"
                  title="Çıkış Yap"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Çıkış Yap</span>
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5">
                    Giriş Yap
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white">
                    Ücretsiz Dene
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-slate-400 hover:text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menü"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/5 space-y-3">
            {isLanding && (
              <>
                <a href="#nasil-calisir" className="block text-slate-400 hover:text-white transition-colors text-sm py-2" onClick={() => setMobileMenuOpen(false)}>
                  Nasıl Çalışır?
                </a>
                <a href="#fiyatlandirma" className="block text-slate-400 hover:text-white transition-colors text-sm py-2" onClick={() => setMobileMenuOpen(false)}>
                  Fiyatlandırma
                </a>
              </>
            )}
            {user ? (
              <div className="space-y-3 pt-1">
                <Link href="/dashboard/instagram" className="block" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full border-indigo-500/30 text-indigo-300 hover:text-white hover:bg-indigo-500/10 flex items-center justify-center gap-2">
                    <Camera className="w-4 h-4 text-indigo-400" /> Instagram İlan Kartı
                  </Button>
                </Link>
                <Link href="/dashboard/new" className="block" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Yeni İlan Oluştur
                  </Button>
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 text-slate-200 hover:text-white transition-colors text-sm py-2 px-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-xs font-semibold">
                    {userInitial}
                  </div>
                  <span>Profilim ({displayName})</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-sm py-2 px-1 w-full text-left"
                >
                  <LogOut className="w-4 h-4" /> Çıkış Yap
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full text-slate-300 hover:text-white hover:bg-white/5">
                    Giriş Yap
                  </Button>
                </Link>
                <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white">
                    Ücretsiz Dene
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
