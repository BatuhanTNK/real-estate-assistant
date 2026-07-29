"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CreditCard, Lock, ShieldCheck, CheckCircle2 } from "lucide-react";

interface CreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    id: "individual" | "team";
    name: string;
    price: string;
  };
}

export function CreditCardModal({ isOpen, onClose, plan }: CreditCardModalProps) {
  const router = useRouter();

  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "3d" | "success">("form");

  if (!isOpen) return null;

  // Format Card Number (XXXX XXXX XXXX XXXX)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };

  // Format Expiry (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setExpiry(raw);
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCard = cardNumber.replace(/\s/g, "");
    if (cleanCard.length < 16) {
      toast.error("Lütfen 16 haneli geçerli bir kart numarası girin");
      return;
    }
    if (expiry.length < 5) {
      toast.error("Son kullanma tarihini (AA/YY) girin");
      return;
    }
    if (cvc.length < 3) {
      toast.error("3 haneli CVC kodunu girin");
      return;
    }

    setLoading(true);
    setStep("3d");

    // 3D Secure simülasyon süresi
    setTimeout(async () => {
      try {
        const res = await fetch("/api/checkout/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: plan.id }),
        });

        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Ödeme başarısız oldu");
          setStep("form");
          setLoading(false);
          return;
        }

        setStep("success");
        setTimeout(() => {
          toast.success(`Tebrikler! ${plan.name} aktif edildi 🎉`);
          router.push("/dashboard");
        }, 1500);
      } catch {
        toast.error("Ödeme sırasında bir hata oluştu");
        setStep("form");
        setLoading(false);
      }
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-base">Güvenli Ödeme</h3>
              <p className="text-slate-400 text-xs">{plan.name} — {plan.price}/ay</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-white h-8 w-8 p-0"
          >
            ✕
          </Button>
        </div>

        {step === "form" && (
          <form onSubmit={handlePay} className="space-y-4">
            {/* Kart Görseli (Preview) */}
            <div className="p-4 rounded-xl bg-gradient-to-tr from-indigo-900/80 via-slate-900 to-indigo-950 border border-indigo-500/30 shadow-inner space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-indigo-300 font-mono tracking-widest">İYZİCO SECURE</span>
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px]">
                  256-Bit SSL
                </Badge>
              </div>
              <div className="font-mono text-lg text-white tracking-wider">
                {cardNumber || "•••• •••• •••• ••••"}
              </div>
              <div className="flex justify-between items-end text-xs font-mono text-slate-300">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Kart Sahibi</p>
                  <p className="font-medium truncate max-w-[180px] uppercase">
                    {cardHolder || "AD SOYAD"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Son Kullanma</p>
                  <p className="font-medium">{expiry || "AA/YY"}</p>
                </div>
              </div>
            </div>

            {/* Kart Sahibi */}
            <div className="space-y-1.5">
              <Label htmlFor="card-holder" className="text-slate-300 text-xs">Kart Üzerindeki İsim</Label>
              <Input
                id="card-holder"
                placeholder="Örn: BATUHAN TONK"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 uppercase text-sm"
              />
            </div>

            {/* Kart Numarası */}
            <div className="space-y-1.5">
              <Label htmlFor="card-number" className="text-slate-300 text-xs">Kart Numarası</Label>
              <div className="relative">
                <Input
                  id="card-number"
                  placeholder="5549 6000 0000 0001"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  required
                  maxLength={19}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 font-mono text-sm pr-10"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* SKT & CVC */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="card-expiry" className="text-slate-300 text-xs">SKT (AA/YY)</Label>
                <Input
                  id="card-expiry"
                  placeholder="12/28"
                  value={expiry}
                  onChange={handleExpiryChange}
                  required
                  maxLength={5}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="card-cvc" className="text-slate-300 text-xs">CVC / CVV</Label>
                <Input
                  id="card-cvc"
                  placeholder="123"
                  type="password"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  required
                  maxLength={4}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 font-mono text-sm"
                />
              </div>
            </div>

            {/* Test Bilgisi */}
            <p className="text-[11px] text-slate-400 bg-white/5 p-2.5 rounded-lg border border-white/5 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Test modundasınız. İstediğiniz 16 haneli test kart numarasını girebilirsiniz.</span>
            </p>

            {/* Ödeme Yap Butonu */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-medium py-5 text-base shadow-lg shadow-emerald-500/20"
            >
              <Lock className="w-4 h-4 mr-2" />
              {plan.price} Öde ve Başla
            </Button>
          </form>
        )}

        {step === "3d" && (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto text-indigo-400">
              <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <div>
              <h4 className="text-white font-semibold text-lg">3D Secure Doğrulanıyor...</h4>
              <p className="text-slate-400 text-sm mt-1">Bankanız ile güvenli iletişim kuruluyor, lütfen bekleyin.</p>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="py-12 text-center space-y-4 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-xl">Ödeme Başarılı!</h4>
              <p className="text-slate-400 text-sm mt-1">{plan.name} aboneliğiniz tanımlandı. Yonlendiriliyorsunuz...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
