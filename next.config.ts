import type { NextConfig } from "next";

/**
 * Tarayıcının bağlanmasına izin verilen Supabase origin'i.
 * Build/CI'da env eksikse CSP connect-src yalnız 'self'e düşer (çökmez).
 */
function getSupabaseOrigin(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return "";
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

function buildContentSecurityPolicy(): string {
  const supabaseOrigin = getSupabaseOrigin();
  const connectSrc = ["'self'", supabaseOrigin, "https://*.iyzipay.com", "https://sandbox-api.iyzipay.com"]
    .filter(Boolean)
    .join(" ");
  const isDev = process.env.NODE_ENV !== "production";
  const scriptSrc = isDev
    ? "'self' 'unsafe-inline' 'unsafe-eval' https://*.iyzipay.com https://static.iyzipay.com https://sandbox-static.iyzipay.com"
    : "'self' 'unsafe-inline' https://*.iyzipay.com https://static.iyzipay.com https://sandbox-static.iyzipay.com";

  return [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.iyzipay.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `img-src 'self' data: blob: https://*.iyzipay.com`,
    `connect-src ${connectSrc}`,
    `frame-src 'self' https://*.iyzipay.com https://sandbox-static.iyzipay.com https://sandbox-api.iyzipay.com`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: buildContentSecurityPolicy() },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: false,
  serverExternalPackages: ["iyzipay"],
  devIndicators: false,
  async headers() {
    if (process.env.NODE_ENV !== "production") {
      return [];
    }
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
