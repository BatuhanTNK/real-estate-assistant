"use client";

import { useState, useRef } from "react";
import { AspectRatio, StudioPlatform } from "@/lib/utils/canvas-renderer";
import { Copy, Check, ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselPreviewProps {
  slides: string[]; // data URLs or blob URLs
  caption?: string;
  aspectRatio?: AspectRatio;
  platform?: StudioPlatform;
  onPlatformChange?: (platform: StudioPlatform) => void;
}

const ASPECT_CLASSES: Record<AspectRatio, string> = {
  "4:5": "aspect-[4/5]",
  "1:1": "aspect-square",
  "4:3": "aspect-[4/3]",
  "16:9": "aspect-video",
  "9:16": "aspect-[9/16]",
};

const PLATFORM_LABELS: Record<StudioPlatform, { title: string; icon: string }> = {
  sahibinden: { title: "Sahibinden.com İlan Metni", icon: "🏠" },
  instagram: { title: "Instagram Gönderi Açıklaması", icon: "📸" },
  facebook: { title: "Facebook / Marketplace Açıklaması", icon: "📘" },
};

/**
 * Çoklu platform (Sahibinden, Instagram, Facebook) galeri / carousel önizleme bileşeni.
 * Slaytları yatay kaydırma (ok butonları) ile gösterir.
 * Altında dot indicators ve platforma özel açıklama kopyalama alanı yer alır.
 */
export function InstagramCarouselPreview({
  slides,
  caption,
  aspectRatio = "4:5",
  platform = "instagram",
  onPlatformChange,
}: CarouselPreviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const aspectClass = ASPECT_CLASSES[aspectRatio] || "aspect-[4/5]";

  const goToSlide = (index: number) => {
    if (index >= 0 && index < slides.length) {
      setCurrentSlide(index);
    }
  };

  const handleCopyCaption = async () => {
    if (!caption) return;
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  if (slides.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
        <p className="text-slate-500 text-sm">
          Henüz görsel oluşturulmadı. Önceki adımları tamamlayın.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Platform Seçici Sekmeler */}
      {onPlatformChange && (
        <div className="max-w-md mx-auto grid grid-cols-3 gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
          {[
            { id: "sahibinden" as const, label: "Sahibinden", icon: "🏠" },
            { id: "instagram" as const, label: "Instagram", icon: "📸" },
            { id: "facebook" as const, label: "Facebook", icon: "📘" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onPlatformChange(item.id)}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                platform === item.id
                  ? item.id === "sahibinden"
                    ? "bg-yellow-400 text-slate-950 shadow"
                    : item.id === "facebook"
                    ? "bg-blue-600 text-white shadow"
                    : "bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Platform Gönderi Çerçevesi */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 border-[6px] border-slate-800 shadow-2xl shadow-indigo-950/50 max-w-md mx-auto">
        {/* Platform Üst Çubuğu */}
        {platform === "sahibinden" ? (
          <div className="px-3.5 py-2.5 bg-slate-900 flex items-center justify-between border-b border-yellow-400/20">
            <div className="flex items-center gap-2">
              <span className="bg-yellow-400 text-slate-950 font-extrabold text-[11px] px-2 py-0.5 rounded">
                sahibinden.com
              </span>
              <span className="text-slate-300 text-xs font-medium">
                İlan Vitrin &amp; Fotoğraf Galerisi
              </span>
            </div>
            <span className="text-[10px] bg-yellow-400/15 text-yellow-300 border border-yellow-400/30 px-2 py-0.5 rounded font-semibold">
              Büyük Fotoğraf
            </span>
          </div>
        ) : platform === "facebook" ? (
          <div className="px-3.5 py-2.5 bg-slate-900 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-[11px] font-bold text-white">
                FB
              </div>
              <div>
                <span className="text-white text-xs font-semibold block">
                  Emlak &amp; Gayrimenkul Portföyü
                </span>
                <span className="text-blue-400 text-[10px] block">
                  Facebook Marketplace • Sponsorlu
                </span>
              </div>
            </div>
            <div className="text-slate-400 text-sm font-bold">•••</div>
          </div>
        ) : (
          <div className="px-3.5 py-2.5 bg-slate-950 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[1.5px]">
                <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden flex items-center justify-center text-[10px] font-bold text-white">
                  IA
                </div>
              </div>
              <div>
                <span className="text-white text-xs font-semibold block">
                  ilan.asistani
                </span>
                <span className="text-slate-400 text-[10px] block">Instagram</span>
              </div>
            </div>
            <div className="text-slate-400 text-sm font-bold">•••</div>
          </div>
        )}

        {/* Slayt Görüntüleme */}
        <div
          ref={containerRef}
          className={`relative ${aspectClass} overflow-hidden bg-black`}
        >
          {slides.map((src, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-transform duration-300 ease-out"
              style={{
                transform: `translateX(${(i - currentSlide) * 100}%)`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Slayt ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}

          {/* Sol Ok */}
          {currentSlide > 0 && (
            <button
              onClick={() => goToSlide(currentSlide - 1)}
              aria-label="Önceki slayt"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition-colors shadow-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Sağ Ok */}
          {currentSlide < slides.length - 1 && (
            <button
              onClick={() => goToSlide(currentSlide + 1)}
              aria-label="Sonraki slayt"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition-colors shadow-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Slayt Numarası */}
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow">
            {currentSlide + 1} / {slides.length}
          </div>
        </div>

        {/* Platform Alt Çubuğu */}
        <div className="px-3.5 py-2.5 bg-slate-950 flex items-center justify-between border-t border-white/5">
          {platform === "sahibinden" ? (
            <div className="flex items-center gap-2 text-xs text-yellow-400 font-semibold">
              <span>🏠 Fotoğraf {currentSlide + 1}</span>
            </div>
          ) : platform === "facebook" ? (
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <span>👍 Beğen</span>
              <span>💬 Yorum</span>
              <span>↗️ Paylaş</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm">
              <span>❤️</span>
              <span>💬</span>
              <span>↗️</span>
            </div>
          )}

          {/* Dot Indicators */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                aria-label={`Slayt ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === currentSlide
                    ? platform === "sahibinden"
                      ? "bg-yellow-400 w-4"
                      : platform === "facebook"
                      ? "bg-blue-400 w-4"
                      : "bg-indigo-400 w-4"
                    : "bg-white/30 hover:bg-white/50 w-1.5"
                }`}
              />
            ))}
          </div>

          <span className="text-sm">
            {platform === "sahibinden" ? "⭐ Favori" : platform === "facebook" ? "💬 Mesaj" : "🔖"}
          </span>
        </div>
      </div>

      {/* Caption Area */}
      {caption && (
        <div className="max-w-md mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <span>{PLATFORM_LABELS[platform].icon}</span>
                <span>{PLATFORM_LABELS[platform].title}</span>
              </span>
              <button
                onClick={handleCopyCaption}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Kopyalandı!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Metni Kopyala
                  </>
                )}
              </button>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto pr-1">
              {caption}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
