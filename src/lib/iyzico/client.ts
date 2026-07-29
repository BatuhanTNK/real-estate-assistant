import Iyzipay from "iyzipay";

export const PLANS_CONFIG = {
  individual: {
    id: "individual",
    name: "Bireysel Plan",
    price: "129.00",
    displayPrice: "₺129",
    period: "aylık",
    planType: "individual" as const,
  },
  team: {
    id: "team",
    name: "Ofis Planı",
    price: "449.00",
    displayPrice: "₺449",
    period: "aylık",
    planType: "team" as const,
  },
};

export function getIyzipayInstance(): Iyzipay {
  const apiKey = process.env.IYZICO_API_KEY || "sandbox-apiKey";
  const secretKey = process.env.IYZICO_SECRET_KEY || "sandbox-secretKey";
  const uri = process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com";

  return new Iyzipay({
    apiKey,
    secretKey,
    uri,
  });
}
