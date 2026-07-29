"use client";

import { useState, useRef } from "react";

interface CarouselPreviewProps {
  slides: string[]; // data URLs or blob URLs
  caption?: string;
}

/**
 * Instagram-style carousel önizleme bileşeni.
 * Slaytları yatay kaydırma (ok butonları + swipe) ile gösterir.
 * Altında dot indicators ve caption kopyalama alanı yer alır.
 */
export function InstagramCarouselPreview({
  slides,
  caption,
}: CarouselPreviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
          Henüz slayt oluşturulmadı. Önceki adımları tamamlayın.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Instagram Post Frame */}
      <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10 max-w-lg mx-auto">
        {/* Slayt Görüntüleme */}
        <div ref={containerRef} className="relative aspect-[4/5] overflow-hidden">
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
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {/* Sağ Ok */}
          {currentSlide < slides.length - 1 && (
            <button
              onClick={() => goToSlide(currentSlide + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}

          {/* Slayt Numarası */}
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
            {currentSlide + 1} / {slides.length}
          </div>
        </div>

        {/* Dot Indicators */}
        <div className="flex items-center justify-center gap-1.5 py-3 bg-slate-950">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                i === currentSlide
                  ? "bg-indigo-400 w-4"
                  : "bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Caption Area */}
      {caption && (
        <div className="max-w-lg mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                📝 Instagram Açıklama (Caption)
              </span>
              <button
                onClick={handleCopyCaption}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                {copied ? (
                  <>
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Kopyalandı!
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Kopyala
                  </>
                )}
              </button>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap line-clamp-6">
              {caption}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
