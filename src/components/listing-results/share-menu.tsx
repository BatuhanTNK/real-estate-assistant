"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export type SharePayload = {
  /** Tek ton metni veya tüm tonların birleştirilmiş bloğu. */
  text: string;
  /** Etiket: hangi içeriğin paylaşıldığını toast'ta gösterir. */
  label: string;
};

function buildWhatsAppUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function buildRedditUrl(text: string): string {
  // Reddit "submit" intent — başlik/tur metni iletir.
  return `https://www.reddit.com/submit?title=${encodeURIComponent("Emlak İlan Metni")}&text=${encodeURIComponent(text)}`;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Paylaşım dropdown'ı. WhatsApp/Reddit tarayıcı paylaşım intent'leri
 * açar; "Tümünü kopyala" panoya yazar. `window.open` yeni sekmede açar.
 */
export function ShareMenu({ payload }: { payload: SharePayload }) {
  const [open, setOpen] = useState(false);

  const openShare = (url: string) => {
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    setOpen(false);
  };

  const handleShareWhatsApp = () => openShare(buildWhatsAppUrl(payload.text));

  const handleShareReddit = () => openShare(buildRedditUrl(payload.text));

  const handleCopyAll = async () => {
    setOpen(false);
    const ok = await copyToClipboard(payload.text);
    if (ok) {
      toast.success(`${payload.label} panoya kopyalandı!`);
    } else {
      toast.error("Kopyalama başarısız oldu");
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white hover:bg-white/5"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.066 12.085 8 11.246 8 10V7a2 2 0 012-2h4a2 2 0 012 2v3c0 1.246-.066 2.085-.684 3.342M12 22v-9m0 9H8m4 0h4"
              />
            </svg>
            Paylaş
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-slate-200">
        <DropdownMenuItem onClick={handleShareWhatsApp} className="hover:bg-white/5 focus:bg-white/5">
          <svg className="w-4 h-4 mr-2 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a8.49 8.49 0 001.592 5.04l-.999 3.648 3.906-1.026z" />
          </svg>
          WhatsApp ile paylaş
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareReddit} className="hover:bg-white/5 focus:bg-white/5">
          <svg className="w-4 h-4 mr-2 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 6.014 4.418 10.998 10.187 11.866v-8.387H7.124v-3.479h3.063v-2.79c0-3.046 1.871-4.71 4.571-4.71 1.317 0 2.683.236 2.683.236v2.953h-1.512c-1.49 0-1.953.927-1.953 1.879v2.332h3.328l-.532 3.479h-2.796v8.387C19.582 22.998 24 18.014 24 12z" />
          </svg>
          Reddit&rsquo;te paylaş
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyAll} className="hover:bg-white/5 focus:bg-white/5">
          <svg className="w-4 h-4 mr-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          {payload.label === "Tüm metinler" ? "Tümünü kopyala" : "Metni kopyala"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** 3 tonu tek metin bloğuna birleştirir (üst başlık "Tümünü kopyala/paylaş" için). */
export function buildCombinedText(result: {
  resmi: string;
  samimi: string;
  kisa: string;
}): string {
  return [
    "RESMİ TON",
    result.resmi,
    "",
    "SAMİMİ TON",
    result.samimi,
    "",
    "KISA TON",
    result.kisa,
  ].join("\n");
}
