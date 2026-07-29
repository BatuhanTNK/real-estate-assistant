import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E — yalnızca ortam-bağımsız/statik yollar.
 * Auth + ilan üretimi gerçek Supabase DB ve Gemini API gerektirdiği için
 * bu config'in kapsamı dışındadır (env gerektirmeden CI'da çalışır).
 *
 * webServer prod build'i başlatır; statik rotalar (○/●) env gerektirmez.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // 3100 portu, geliştirme makinesinde zaten :3000'de çalışan başka bir
    // Next.js uygulamasıyla çakışmayı önler. CI'da da aynı portu kullanırız.
    command: "npm run build && npm run start -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
