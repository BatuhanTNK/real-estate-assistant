"use client";

import { ResultCards } from "@/components/listing-results/result-cards";

interface ResultCardsServerProps {
  result: {
    resmi: string;
    samimi: string;
    kisa: string;
  };
}

export function ResultCardsServer({ result }: ResultCardsServerProps) {
  return <ResultCards result={result} onRegenerate={() => {}} />;
}
