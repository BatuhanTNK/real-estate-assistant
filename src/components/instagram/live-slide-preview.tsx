"use client";

import {
  SlideTheme,
  AspectRatio,
  CoverLayoutType,
  StudioPlatform,
} from "@/lib/utils/canvas-renderer";
import { Sparkles, Eye } from "lucide-react";

interface LiveSlidePreviewProps {
  platform?: StudioPlatform;
  onPlatformChange?: (platform: StudioPlatform) => void;
  layoutType: CoverLayoutType;
  theme: SlideTheme;
  aspectRatio: AspectRatio;
  coverImage: string | null;
  avatarImage: string | null;
  price: string;
  location: string;
  area: string;
  rooms: string;
  floor: string;
  badgeText: string;
  agentName: string;
  officeName?: string;
  phoneNumber?: string;
  logoUrl?: string;
}

const ASPECT_CLASSES: Record<AspectRatio, string> = {
  "4:5": "aspect-[4/5]",
  "1:1": "aspect-square",
  "4:3": "aspect-[4/3]",
  "16:9": "aspect-video",
  "9:16": "aspect-[9/16]",
};

export function LiveSlidePreview({
  platform = "instagram",
  onPlatformChange,
  layoutType,
  theme,
  aspectRatio,
  coverImage,
  avatarImage,
  price,
  location,
  area,
  rooms,
  floor,
  badgeText,
  agentName,
  officeName,
  phoneNumber,
  logoUrl,
}: LiveSlidePreviewProps) {
  const aspectClass = ASPECT_CLASSES[aspectRatio] || "aspect-[4/5]";
  const isWide = aspectRatio === "4:3" || aspectRatio === "16:9";

  // Tema stilleri
  const themeClasses = {
    modern_dark: {
      gradient: "from-transparent via-slate-950/75 to-slate-950/95",
      accentBadge: "bg-indigo-600 text-white",
      accentPrice: "text-white",
      divider: "bg-white/15",
      ring: "ring-indigo-500",
    },
    gold_luxury: {
      gradient: "from-transparent via-slate-950/85 to-black/98",
      accentBadge: "bg-amber-600 text-white",
      accentPrice: "text-amber-200",
      divider: "bg-amber-500/30",
      ring: "ring-amber-500",
    },
    clean_glass: {
      gradient: "from-transparent via-slate-900/60 to-slate-950/90",
      accentBadge: "bg-indigo-500 text-white",
      accentPrice: "text-white",
      divider: "bg-white/20",
      ring: "ring-indigo-400",
    },
    sahibinden_vitrin: {
      gradient: "from-transparent via-slate-950/85 to-slate-950/98",
      accentBadge: "bg-yellow-400 text-slate-950",
      accentPrice: "text-yellow-300",
      divider: "bg-yellow-400/35",
      ring: "ring-yellow-400",
    },
  }[theme];

  return (
    <div className="flex flex-col items-center">
      {/* Üst Bilgi Rozeti & Platform Seçici */}
      <div
        className={`flex flex-col gap-2 w-full ${
          isWide ? "max-w-[420px]" : "max-w-[350px]"
        } mb-2.5 px-1`}
      >
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1 text-indigo-400 font-medium">
            <Eye className="w-3.5 h-3.5" />
            Canlı Platform Önizlemesi
          </span>
          <span className="text-[11px] bg-white/5 px-2 py-0.5 rounded text-slate-300 border border-white/10">
            {aspectRatio}
          </span>
        </div>

        {onPlatformChange && (
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
            {[
              { id: "sahibinden" as const, label: "Sahibinden", icon: "🏠" },
              { id: "instagram" as const, label: "Instagram", icon: "📸" },
              { id: "facebook" as const, label: "Facebook", icon: "📘" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onPlatformChange(item.id)}
                className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all ${
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
      </div>

      {/* Önizleme Çerçevesi */}
      <div
        className={`w-full ${
          isWide ? "max-w-[420px]" : "max-w-[350px]"
        } rounded-3xl bg-slate-950 border-[6px] border-slate-800 shadow-2xl shadow-indigo-950/40 overflow-hidden relative`}
      >
        {/* Platform Üst Başlığı */}
        {platform === "sahibinden" ? (
          <div className="px-3 py-2 bg-slate-900 border-b border-yellow-400/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-yellow-400 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 rounded tracking-tight">
                sahibinden.com
              </span>
              <span className="text-slate-300 text-[10px] font-medium truncate max-w-[160px]">
                Emlak &gt; Konut &gt; {location ? location.split(",")[0] : "İlan"}
              </span>
            </div>
            <span className="text-[9px] bg-yellow-400/15 text-yellow-300 border border-yellow-400/30 px-1.5 py-0.5 rounded font-semibold">
              Vitrin
            </span>
          </div>
        ) : platform === "facebook" ? (
          <div className="px-3 py-2 bg-slate-900/95 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-600 p-[1.5px]">
                <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden flex items-center justify-center text-[9px] font-bold text-white">
                  {avatarImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarImage}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : agentName ? (
                    agentName.charAt(0).toUpperCase()
                  ) : (
                    "F"
                  )}
                </div>
              </div>
              <div className="leading-none">
                <span className="text-white text-[11px] font-semibold block truncate max-w-[160px]">
                  {officeName || agentName || "Gayrimenkul Danışmanı"}
                </span>
                <span className="text-blue-400 text-[9px] block">
                  Facebook Marketplace • {location ? location.split(",")[0] : "Sponsorlu"}
                </span>
              </div>
            </div>
            <div className="text-slate-500 text-xs">•••</div>
          </div>
        ) : (
          <div className="px-3 py-2 bg-slate-950/90 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[1.5px]">
                <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden flex items-center justify-center text-[9px] font-bold text-white">
                  {avatarImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarImage}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : agentName ? (
                    agentName.charAt(0).toUpperCase()
                  ) : (
                    "E"
                  )}
                </div>
              </div>
              <div className="leading-none">
                <span className="text-white text-[11px] font-semibold block truncate max-w-[150px]">
                  {officeName || agentName || "emlak.asistani"}
                </span>
                <span className="text-slate-400 text-[9px] block">
                  {location ? location.split(",")[0] : "Instagram"}
                </span>
              </div>
            </div>
            <div className="text-slate-500 text-xs">•••</div>
          </div>
        )}

        {/* Slayt Alanı */}
        <div
          className={`relative w-full ${aspectClass} bg-slate-900 overflow-hidden select-none`}
        >
          {/* Arka Plan Görseli */}
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage}
              alt="Kapak Görseli"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-900 flex flex-col items-center justify-center text-slate-500 p-4 text-center">
              <Sparkles className="w-8 h-8 text-indigo-400/40 mb-2 animate-pulse" />
              <p className="text-xs text-slate-400">
                Kapak fotoğrafı yükleyin veya soldan bir model seçin
              </p>
            </div>
          )}

          {/* Üst Şerit (gold_luxury veya sahibinden_vitrin için) */}
          {(theme === "gold_luxury" || theme === "sahibinden_vitrin") && (
            <div
              className={`absolute top-0 left-0 right-0 h-1 z-10 ${
                theme === "sahibinden_vitrin"
                  ? "bg-gradient-to-r from-yellow-400 via-yellow-300 to-amber-500"
                  : "bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-600"
              }`}
            />
          )}

          {/* Gradient Katmanı */}
          <div
            className={`absolute inset-0 bg-gradient-to-b ${themeClasses.gradient}`}
          />

          {/* Clean Glass Kutu (clean_glass için) */}
          {theme === "clean_glass" && (
            <div className="absolute inset-x-3 bottom-3 top-[50%] rounded-xl bg-slate-900/70 border border-white/20 backdrop-blur-md -z-0 pointer-events-none" />
          )}

          {/* İçerik */}
          <div className="absolute inset-x-0 bottom-0 p-3.5 flex flex-col justify-end z-10">
            {/* Rozet */}
            {badgeText && (
              <div className="mb-1.5">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase ${themeClasses.accentBadge}`}
                >
                  {badgeText}
                </span>
              </div>
            )}

            {/* Fiyat */}
            <div className="mb-1">
              <div
                className={`${
                  isWide ? "text-lg" : "text-xl"
                } font-extrabold tracking-tight drop-shadow-md leading-tight ${
                  themeClasses.accentPrice
                }`}
              >
                {price || "₺0.000.000"}
              </div>
            </div>

            {/* Detaylar (Konum • m² • Oda • Kat) */}
            <div className="text-[10px] font-medium text-white/90 flex flex-wrap items-center gap-1.5 mb-2">
              {location && <span>📍 {location}</span>}
              {area && <span>📐 {area}</span>}
              {rooms && <span>🚪 {rooms}</span>}
              {floor && <span>🏢 {floor}</span>}
            </div>

            {/* Ayırıcı */}
            <div className={`w-full h-px ${themeClasses.divider} mb-2`} />

            {/* Danışman & Ofis Bilgisi (Seçilen Modele Göre) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {layoutType === "property_focused" && avatarImage && (
                  <div
                    className={`w-7 h-7 rounded-full overflow-hidden ring-2 ${themeClasses.ring} shadow-md shrink-0`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatarImage}
                      alt={agentName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="leading-tight">
                  {layoutType !== "minimal_corporate" ? (
                    <>
                      <div className="text-white text-[11px] font-bold truncate max-w-[160px]">
                        {agentName || "Emlak Danışmanı"}
                      </div>
                      {(officeName || phoneNumber) && (
                        <div className="text-slate-300/80 text-[9px] truncate max-w-[160px]">
                          {[officeName, phoneNumber].filter(Boolean).join(" • ")}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-white text-[11px] font-bold truncate max-w-[160px]">
                        {officeName || "Gayrimenkul"}
                      </div>
                      {phoneNumber && (
                        <div className="text-slate-300/80 text-[9px]">
                          İletişim: {phoneNumber}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-5 max-w-[60px] object-contain opacity-90"
                />
              )}
            </div>
          </div>
        </div>

        {/* Platform Alt Çubuğu */}
        {platform === "sahibinden" ? (
          <div className="px-3 py-2 bg-slate-900 flex items-center justify-between text-[10px] border-t border-yellow-400/20">
            <span className="text-yellow-400 font-bold">
              {price || "Fiyat Belirtilmedi"}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="bg-blue-600/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded font-medium">
                📞 Ara
              </span>
              <span className="bg-yellow-400 text-slate-950 px-2 py-0.5 rounded font-bold">
                Mesaj Gönder
              </span>
            </div>
          </div>
        ) : platform === "facebook" ? (
          <div className="px-3 py-2 bg-slate-900 flex items-center justify-between text-[11px] text-slate-300 border-t border-white/5">
            <div className="flex items-center gap-3">
              <span>👍 Beğen</span>
              <span>💬 Yorum</span>
              <span>↗️ Paylaş</span>
            </div>
            <span className="bg-blue-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
              Mesaj Gönder
            </span>
          </div>
        ) : (
          <div className="px-3 py-2 bg-slate-950 flex items-center justify-between text-white/80 border-t border-white/5">
            <div className="flex items-center gap-2.5 text-xs">
              <span>❤️</span>
              <span>💬</span>
              <span>↗️</span>
            </div>
            <span className="text-xs">🔖</span>
          </div>
        )}
      </div>
    </div>
  );
}
