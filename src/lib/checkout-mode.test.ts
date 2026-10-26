import { afterEach, describe, expect, it, vi } from "vitest";
import { isTestCheckoutEnabled } from "./checkout-mode";
import { POST } from "@/app/api/checkout/simulate/route";
import { NextRequest } from "next/server";

const mockClient = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/server", () => ({ createClient: mockClient, createServiceClient: mockClient }));
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe("Simulated checkout access", () => {
  it.each(["production", "test"])("is blocked in %s even with the flag enabled", async (mode) => {
    vi.stubEnv("NODE_ENV", mode);
    vi.stubEnv("ENABLE_TEST_CHECKOUT", "true");
    expect(isTestCheckoutEnabled()).toBe(false);
    const response = await POST(new NextRequest("http://localhost/api/checkout/simulate", { method: "POST", body: JSON.stringify({ plan: "team" }) }));
    expect(response.status).toBe(403);
    expect(mockClient).not.toHaveBeenCalled();
  });
  it("is disabled by default in development", () => {
    vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("ENABLE_TEST_CHECKOUT", undefined);
    expect(isTestCheckoutEnabled()).toBe(false);
  });
  it("requires an explicit development flag", () => {
    vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("ENABLE_TEST_CHECKOUT", "true");
    expect(isTestCheckoutEnabled()).toBe(true);
  });
});
