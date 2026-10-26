"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  testCheckoutEnabled?: boolean;
  plan: { id: "individual" | "team"; name: string; price: string };
}

export function CreditCardModal({ isOpen, onClose, plan, testCheckoutEnabled = false }: CreditCardModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function activateTestPlan() {
    if (loading || !testCheckoutEnabled) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/checkout/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.id }),
      });
      if (response.status === 401) { router.push("/auth"); return; }
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Test planı etkinleştirilemedi.");
      router.push("/dashboard");
      router.refresh();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Bağlantı kurulamadı. Lütfen tekrar deneyin.");
    } finally { setLoading(false); }
  }

  return <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !loading) onClose(); }}>
    <DialogContent showCloseButton={!loading} className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{testCheckoutEnabled ? "Test planını etkinleştir" : "Plan bilgileri"}</DialogTitle>
        <DialogDescription>{plan.name} planı · {plan.price}/ay</DialogDescription>
      </DialogHeader>
      <p className="text-sm leading-relaxed text-slate-300">
        {testCheckoutEnabled
          ? "Bu bir geliştirme ortamı denemesidir. Gerçek ödeme alınmaz ve kart bilgisi gerekmez."
          : "Ücretli planlar şu anda çevrim içi satın alınamıyor. Ücretsiz planla devam edebilir veya bilgi almak için bizimle iletişime geçebilirsiniz."}
      </p>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <DialogFooter>
        <DialogClose render={<Button variant="outline" disabled={loading} />}>Kapat</DialogClose>
        {testCheckoutEnabled
          ? <Button onClick={activateTestPlan} disabled={loading}>{loading ? "Etkinleştiriliyor…" : "Test planını etkinleştir"}</Button>
          : <Link href="/legal/contact" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">İletişime geç</Link>}
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
