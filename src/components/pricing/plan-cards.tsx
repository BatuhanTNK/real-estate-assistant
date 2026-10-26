"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCardModal } from "@/components/pricing/credit-card-modal";

interface PlanItem {
  id: "free" | "individual" | "team";
  name: string;
  price: string;
  period: string;
  description: string;
  features: Array<{ text: string; included: boolean }>;
  cta: string;
  popular?: boolean;
}

export function PlanCards({ plans, testCheckoutEnabled = false }: { plans: PlanItem[]; testCheckoutEnabled?: boolean }) {
  const router = useRouter();
  const [selectedPlanForCard, setSelectedPlanForCard] = useState<PlanItem | null>(null);

  const handleSelectPlan = (plan: PlanItem) => {
    if (plan.id === "free") {
      router.push("/auth");
      return;
    }
    // Kart Giriş Modalı Aç
    setSelectedPlanForCard(plan);
  };

  return (
    <>
      <div className="grid md:grid-cols-3 gap-6 mb-20">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative overflow-visible bg-white/5 border-white/10 backdrop-blur-sm hover:border-white/20 transition-all duration-300 ${
              plan.popular
                ? "ring-2 ring-indigo-500/50 border-indigo-500/30 scale-[1.02]"
                : ""
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white border-0 px-4">
                  En Popüler
                </Badge>
              </div>
            )}
            <CardHeader className="text-center pb-2 pt-8">
              <CardTitle className="text-white text-lg mb-2">
                {plan.name}
              </CardTitle>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-white">
                  {plan.price}
                </span>
                <span className="text-slate-400">{plan.period}</span>
              </div>
              <p className="text-slate-400 text-sm mt-2">{plan.description}</p>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li
                    key={feature.text}
                    className="flex items-start gap-2 text-sm"
                  >
                    {feature.included ? (
                      <svg
                        className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5"
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
                    ) : (
                      <svg
                        className="w-5 h-5 text-slate-600 shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                    <span
                      className={
                        feature.included ? "text-slate-300" : "text-slate-500"
                      }
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSelectPlan(plan)}
                className={`w-full font-medium ${
                  plan.popular
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-500/20"
                    : "bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                {plan.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Kart Bilgileri Giriş Modalı */}
      {selectedPlanForCard && selectedPlanForCard.id !== "free" && (
        <CreditCardModal
          isOpen={!!selectedPlanForCard}
          testCheckoutEnabled={testCheckoutEnabled}
          onClose={() => setSelectedPlanForCard(null)}
          plan={{
            id: selectedPlanForCard.id as "individual" | "team",
            name: selectedPlanForCard.name,
            price: selectedPlanForCard.price,
          }}
        />
      )}
    </>
  );
}
