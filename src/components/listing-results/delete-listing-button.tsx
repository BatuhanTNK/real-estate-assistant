"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DeleteListingButtonProps {
  listingId: string;
  /**
   * "icon" — dashboard satırında küçük çöp ikonu
   * "full"  — detay sayfasında tam sil butonu
   */
  variant?: "icon" | "full";
  /** Detay sayfasında silindikten sonra dashboard'a dönmek için */
  redirectAfterDelete?: boolean;
  className?: string;
  onDeleted?: () => void;
}

export function DeleteListingButton({
  listingId,
  variant = "icon",
  redirectAfterDelete = false,
  className,
  onDeleted,
}: DeleteListingButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", listingId);

      if (error) {
        console.error("Silme hatası:", error);
        toast.error("İlan silinemedi", {
          description: error.message,
        });
        setLoading(false);
        setConfirming(false);
        return;
      }

      toast.success("İlan silindi");
      onDeleted?.();
      if (redirectAfterDelete) {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err) {
      console.error("Silme exception:", err);
      toast.error("İlan silinemedi, lütfen tekrar deneyin");
      setLoading(false);
      setConfirming(false);
    }
  };

  if (variant === "icon") {
    if (confirming) {
      return (
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="destructive"
            disabled={loading}
            onClick={handleDelete}
            className="h-8 px-2 text-xs"
          >
            {loading ? "..." : "Evet"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={loading}
            onClick={() => setConfirming(false)}
            className="h-8 px-2 text-xs text-slate-400 hover:text-white"
          >
            Hayır
          </Button>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        title="İlanı sil"
        aria-label="İlanı sil"
        className={`p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 ${
          className ?? ""
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    );
  }

  // full variant (detay sayfası)
  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="destructive" disabled={loading} onClick={handleDelete}>
          {loading ? "Siliniyor..." : "Evet, sil"}
        </Button>
        <Button
          variant="ghost"
          disabled={loading}
          onClick={() => setConfirming(false)}
          className="text-slate-400 hover:text-white"
        >
          Vazgeç
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      onClick={() => setConfirming(true)}
      className={`text-slate-400 hover:text-red-400 hover:bg-red-500/10 ${className ?? ""}`}
    >
      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      Sil
    </Button>
  );
}
