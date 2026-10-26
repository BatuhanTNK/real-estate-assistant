/** Simulated entitlements are available only in an explicitly enabled dev server. */
export function isTestCheckoutEnabled() {
  return process.env.NODE_ENV === "development" && process.env.ENABLE_TEST_CHECKOUT === "true";
}
