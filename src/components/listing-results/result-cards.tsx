"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ShareMenu,
  buildCombinedText,
} from "@/components/listing-results/share-menu";
import { analyzeText } from "@/lib/utils/text-stats";
import type { TextStatsResult } from "@/lib/utils/text-stats";
import { LANGUAGE_LABELS, LANGUAGE_FLAGS } from "@/lib/ai/translate";
import type { TranslationLanguage } from "@/lib/ai/translate";

interface ResultCardsProps {
  result: {
    resmi: string;
    samimi: string;
    kisa: string;
  };
  onRegenerate: () => void;
}

const tones = [
  {
    key: "resmi" as const,
    label: "Resmi",
    description: "Kurumsal emlak ofisi dili",
    color: "indigo",
    gradient: "from-indigo-500/10 to-indigo-500/5",
    borderColor: "border-indigo-500/20",
    badgeClass: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
  },
  {
    key: "samimi" as const,
    label: "Samimi",
    description: "Sıcak, davetkar dil",
    color: "emerald",
    gradient: "from-emerald-500/10 to-emerald-500/5",
    borderColor: "border-emerald-500/20",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    ),
  },
  {
    key: "kisa" as const,
    label: "Kısa",
    description: "Sosyal medya için",
    color: "amber",
    gradient: "from-amber-500/10 to-amber-500/5",
    borderColor: "border-amber-500/20",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
        />
      </svg>
    ),
  },
];

const AVAILABLE_LANGUAGES: TranslationLanguage[] = [
  "en",
  "ar",
  "ru",
  "de",
  "fr",
];

const REFINE_SUGGESTIONS = [
  "Daha kısa yap",
  "Daha detaylı yaz",
  "Daha resmi tonda yaz",
  "Daha samimi tonda yaz",
  "Fiyat vurgusunu artır",
  "Konum avantajlarını öne çıkar",
];

/** ──────────── TextStats Bileşeni ──────────── */
function TextStatsBar({ stats }: { stats: TextStatsResult }) {
  const readabilityColor =
    stats.readabilityScore >= 65
      ? "text-emerald-400"
      : stats.readabilityScore >= 35
      ? "text-amber-400"
      : "text-red-400";

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-3 pt-3 border-t border-white/5">
      <span>
        <strong className="text-slate-400">{stats.wordCount}</strong> kelime
      </span>
      <span>
        <strong className="text-slate-400">{stats.charCountWithSpaces}</strong>{" "}
        karakter
      </span>
      <span>
        <strong className="text-slate-400">{stats.sentenceCount}</strong> cümle
      </span>
      <span>
        ~<strong className="text-slate-400">{stats.readingTimeSeconds}</strong>
        sn okuma
      </span>
      <span className={readabilityColor}>
        ● {stats.readabilityLabel}
      </span>
      {/* Platform uyumluluk ikonları */}
      <span className="flex items-center gap-1.5 ml-auto">
        {stats.platformChecks.slice(0, 3).map((p) => (
          <span
            key={p.platform}
            title={`${p.platform}: ${p.currentChars}/${p.maxChars} karakter ${
              p.isOk ? "✓" : "✗"
            }`}
            className={`cursor-default ${
              p.isOk ? "opacity-60" : "text-red-400 opacity-100"
            }`}
          >
            {p.icon}
          </span>
        ))}
      </span>
    </div>
  );
}

/** ──────────── Refine (Düzenleme) Paneli ──────────── */
function RefinePanel({
  originalText,
  onApply,
  onClose,
}: {
  originalText: string;
  onApply: (refined: string) => void;
  onClose: () => void;
}) {
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleRefine = async (instr?: string) => {
    const finalInstruction = instr || instruction;
    if (!finalInstruction.trim()) {
      toast.error("Lütfen bir düzenleme yönergesi girin");
      return;
    }

    setLoading(true);
    setPreview(null);

    try {
      const res = await fetch("/api/refine-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: originalText, instruction: finalInstruction }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Düzenleme başarısız");
        return;
      }

      setPreview(data.refined);
      toast.success("Metin düzenlendi! Önizlemeyi kontrol edin.");
    } catch {
      toast.error("Bağlantı hatası, tekrar deneyin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 p-4 bg-white/3 rounded-xl border border-white/10 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white flex items-center gap-2">
          <svg
            className="w-4 h-4 text-indigo-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          AI ile Düzenle
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-slate-400 hover:text-white h-7 w-7 p-0"
        >
          ✕
        </Button>
      </div>

      {/* Hızlı öneriler */}
      <div className="flex flex-wrap gap-1.5">
        {REFINE_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => {
              setInstruction(suggestion);
              handleRefine(suggestion);
            }}
            disabled={loading}
            className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-400 border border-white/5 hover:border-indigo-500/20 transition-all disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Özel yönerge */}
      <div className="flex gap-2">
        <Textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Düzenleme yönergenizi yazın... (örn: 'Son paragrafı kaldır', 'Daha vurgulu yap')"
          rows={2}
          className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 resize-none text-sm flex-1"
        />
        <Button
          onClick={() => handleRefine()}
          disabled={loading || !instruction.trim()}
          className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shrink-0 self-end"
        >
          {loading ? (
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            "Düzenle"
          )}
        </Button>
      </div>

      {/* Önizleme */}
      {preview && (
        <div className="space-y-2 animate-in fade-in duration-300">
          <p className="text-xs text-slate-500">Önizleme:</p>
          <div className="p-3 bg-white/5 rounded-lg border border-emerald-500/20">
            <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
              {preview}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                onApply(preview);
                setPreview(null);
                setInstruction("");
                toast.success("Düzenleme uygulandı!");
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
            >
              <svg
                className="w-3.5 h-3.5 mr-1"
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
              Uygula
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPreview(null)}
              className="text-slate-400 hover:text-white text-xs"
            >
              İptal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** ──────────── Çeviri Paneli ──────────── */
function TranslatePanel({
  originalText,
  onClose,
}: {
  originalText: string;
  onClose: () => void;
}) {
  const [selectedLang, setSelectedLang] =
    useState<TranslationLanguage | null>(null);
  const [loading, setLoading] = useState(false);
  const [translated, setTranslated] = useState<string | null>(null);
  const [translatedLang, setTranslatedLang] = useState<string>("");

  const handleTranslate = async (lang: TranslationLanguage) => {
    setSelectedLang(lang);
    setLoading(true);
    setTranslated(null);

    try {
      const res = await fetch("/api/translate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: originalText, language: lang }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Çeviri başarısız");
        return;
      }

      setTranslated(data.translated);
      setTranslatedLang(data.languageLabel);
      toast.success(`${data.languageLabel} çevirisi tamamlandı!`);
    } catch {
      toast.error("Bağlantı hatası, tekrar deneyin");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTranslation = async () => {
    if (!translated) return;
    try {
      await navigator.clipboard.writeText(translated);
      toast.success("Çeviri panoya kopyalandı!");
    } catch {
      toast.error("Kopyalama başarısız oldu");
    }
  };

  return (
    <div className="mt-3 p-4 bg-white/3 rounded-xl border border-white/10 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white flex items-center gap-2">
          <svg
            className="w-4 h-4 text-cyan-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
            />
          </svg>
          Çevir
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-slate-400 hover:text-white h-7 w-7 p-0"
        >
          ✕
        </Button>
      </div>

      {/* Dil seçim butonları */}
      <div className="flex flex-wrap gap-2">
        {AVAILABLE_LANGUAGES.map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => handleTranslate(lang)}
            disabled={loading}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all disabled:opacity-50 ${
              selectedLang === lang
                ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
                : "bg-white/5 border-white/5 text-slate-400 hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/20"
            }`}
          >
            <span>{LANGUAGE_FLAGS[lang]}</span>
            <span>{LANGUAGE_LABELS[lang]}</span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <svg
            className="w-4 h-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Çevriliyor...
        </div>
      )}

      {/* Çeviri sonucu */}
      {translated && !loading && (
        <div className="space-y-2 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {translatedLang} çevirisi:
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyTranslation}
              className="text-slate-400 hover:text-white text-xs h-7"
            >
              <svg
                className="w-3.5 h-3.5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
              Kopyala
            </Button>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-cyan-500/20">
            <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
              {translated}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/** ──────────── Ana ResultCards Bileşeni ──────────── */
export function ResultCards({ result, onRegenerate }: ResultCardsProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [editingTone, setEditingTone] = useState<string | null>(null);
  const [translatingTone, setTranslatingTone] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(true);

  // Metin düzenlemelerini takip et (orijinal result prop'u değiştirilmez)
  const [overrides, setOverrides] = useState<
    Partial<Record<"resmi" | "samimi" | "kisa", string>>
  >({});

  const getCurrentText = (key: "resmi" | "samimi" | "kisa") =>
    overrides[key] ?? result[key];

  // İstatistikleri hesapla
  const stats = useMemo(() => {
    return {
      resmi: analyzeText(getCurrentText("resmi")),
      samimi: analyzeText(getCurrentText("samimi")),
      kisa: analyzeText(getCurrentText("kisa")),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, overrides]);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success("Metin panoya kopyalandı!");
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error("Kopyalama başarısız oldu");
    }
  };

  const handleApplyRefine = (toneKey: "resmi" | "samimi" | "kisa", refined: string) => {
    setOverrides((prev) => ({ ...prev, [toneKey]: refined }));
    setEditingTone(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          Oluşturulan Metinler
        </h2>
        <div className="flex items-center gap-2">
          {/* İstatistik toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowStats(!showStats)}
            className={`text-xs ${
              showStats
                ? "text-indigo-400 bg-indigo-500/10"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
            title={showStats ? "İstatistikleri gizle" : "İstatistikleri göster"}
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            İstatistik
          </Button>
          <ShareMenu
            payload={{
              text: buildCombinedText({
                resmi: getCurrentText("resmi"),
                samimi: getCurrentText("samimi"),
                kisa: getCurrentText("kisa"),
              }),
              label: "Tüm metinler",
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={onRegenerate}
            className="text-slate-400 hover:text-white hover:bg-white/5"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Yeniden Üret
          </Button>
        </div>
      </div>

      {tones.map((tone) => {
        const currentText = getCurrentText(tone.key);
        const isEditing = editingTone === tone.key;
        const isTranslating = translatingTone === tone.key;
        const isModified = overrides[tone.key] !== undefined;

        return (
          <Card
            key={tone.key}
            className={`bg-gradient-to-br ${tone.gradient} ${tone.borderColor} backdrop-blur-sm hover:border-opacity-40 transition-all duration-300`}
          >
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      tone.color === "indigo"
                        ? "bg-indigo-500/20 text-indigo-400"
                        : tone.color === "emerald"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-amber-500/20 text-amber-400"
                    }`}
                  >
                    {tone.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Badge className={tone.badgeClass}>{tone.label}</Badge>
                      {isModified && (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                          Düzenlendi
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {tone.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {/* Çeviri butonu */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setTranslatingTone(isTranslating ? null : tone.key)
                    }
                    className={`text-sm transition-all ${
                      isTranslating
                        ? "text-cyan-400 bg-cyan-500/10"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                    title="Çevir"
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
                        d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                      />
                    </svg>
                  </Button>
                  {/* Düzenle butonu */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setEditingTone(isEditing ? null : tone.key)
                    }
                    className={`text-sm transition-all ${
                      isEditing
                        ? "text-indigo-400 bg-indigo-500/10"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                    title="AI ile düzenle"
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </Button>
                  <ShareMenu
                    payload={{
                      text: currentText,
                      label: `${tone.label} ton`,
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(currentText, tone.key)}
                    className={`text-sm transition-all ${
                      copiedKey === tone.key
                        ? "text-emerald-400 bg-emerald-500/10"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {copiedKey === tone.key ? (
                      <>
                        <svg
                          className="w-4 h-4 mr-1"
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
                        Kopyalandı
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                          />
                        </svg>
                        Kopyala
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                {currentText}
              </p>

              {/* İstatistikler */}
              {showStats && <TextStatsBar stats={stats[tone.key]} />}

              {/* Düzenleme paneli */}
              {isEditing && (
                <RefinePanel
                  originalText={currentText}
                  onApply={(refined) => handleApplyRefine(tone.key, refined)}
                  onClose={() => setEditingTone(null)}
                />
              )}

              {/* Çeviri paneli */}
              {isTranslating && (
                <TranslatePanel
                  originalText={currentText}
                  onClose={() => setTranslatingTone(null)}
                />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
