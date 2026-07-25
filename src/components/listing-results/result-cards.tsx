"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
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
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
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
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
  },
];

export function ResultCards({ result, onRegenerate }: ResultCardsProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Oluşturulan Metinler</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRegenerate}
          className="text-slate-400 hover:text-white hover:bg-white/5"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Yeniden Üret
        </Button>
      </div>

      {tones.map((tone) => (
        <Card
          key={tone.key}
          className={`bg-gradient-to-br ${tone.gradient} ${tone.borderColor} backdrop-blur-sm hover:border-opacity-40 transition-all duration-300`}
        >
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  tone.color === "indigo" ? "bg-indigo-500/20 text-indigo-400" :
                  tone.color === "emerald" ? "bg-emerald-500/20 text-emerald-400" :
                  "bg-amber-500/20 text-amber-400"
                }`}>
                  {tone.icon}
                </div>
                <div>
                  <Badge className={tone.badgeClass}>{tone.label}</Badge>
                  <p className="text-slate-500 text-xs mt-0.5">{tone.description}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(result[tone.key], tone.key)}
                className={`text-sm transition-all ${
                  copiedKey === tone.key
                    ? "text-emerald-400 bg-emerald-500/10"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {copiedKey === tone.key ? (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Kopyalandı
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Kopyala
                  </>
                )}
              </Button>
            </div>
            <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
              {result[tone.key]}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
