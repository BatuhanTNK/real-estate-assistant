import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const publicRoutes = ["/", "/auth", "/pricing", "/legal/contact", "/legal/privacy", "/legal/terms"];

for (const route of publicRoutes) {
  test(route + " — erişilebilirlik ve mobil yerleşim", async ({ page }) => {
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "best-practice"]).analyze();
    expect(audit.violations).toEqual([]);
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("contentinfo")).toHaveCount(1);
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      const metrics = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
      expect(metrics.scroll, route + " at " + width).toBeLessThanOrEqual(metrics.client);
    }
  });
}

test("mobil menü ekran büyüyünce kapanır ve tekrar açılmaz", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Menüyü aç" }).click();
  await page.setViewportSize({ width: 1440, height: 950 });
  await expect(page.getByRole("navigation", { name: "Mobil gezinme" })).not.toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: "Menüyü aç" })).toHaveAttribute("aria-expanded", "false");
});

test("mobil menü logo, Escape ve dış tıklamayla kapanır", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Menüyü aç" }).click();
  await page.getByRole("link", { name: "İlan Asistanı — Ana sayfa", exact: true }).first().click();
  await expect(page.getByRole("button", { name: "Menüyü aç" })).toBeVisible();
  await page.getByRole("button", { name: "Menüyü aç" }).click();
  await page.getByRole("navigation", { name: "Mobil gezinme" }).getByRole("link").first().focus();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Menüyü aç" })).toBeFocused();
  await page.getByRole("button", { name: "Menüyü aç" }).click();
  await page.mouse.click(380, 600);
  await expect(page.getByRole("button", { name: "Menüyü aç" })).toBeVisible();
});

test("klavyeyle gezinmede ana içeriğe atlanabilir", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Ana içeriğe geç" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
});

test("ilan tonları değişir ve pano izni reddedilince açıklama gösterilir", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => { Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: () => Promise.reject(new Error("Denied")) } }); });
  await page.getByRole("button", { name: "Samimi", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Kadıköy’de yeni bir başlangıç" })).toBeVisible();
  await page.getByRole("button", { name: "Örnek metni kopyala" }).click();
  await expect(page.getByText(/Metni seçerek kopyalayabilirsiniz/)).toBeVisible();
});

test("giriş formunda şifre görünürlüğü ve yerel doğrulama çalışır", async ({ page }) => {
  await page.goto("/auth");
  await page.getByLabel("E-posta Adresi", { exact: true }).fill("test@example.com");
  await page.getByLabel("Şifre", { exact: true }).fill("123");
  await page.getByRole("button", { name: "Şifreyi göster" }).click();
  await expect(page.getByLabel("Şifre", { exact: true })).toHaveAttribute("type", "text");
  expect(await page.getByLabel("Şifre", { exact: true }).evaluate((n: HTMLInputElement) => n.validity.valid)).toBe(false);
  await page.getByRole("tab", { name: "Kayıt Ol", exact: true }).click();
  await expect(page.getByRole("tabpanel", { name: "Kayıt Ol", exact: true }).getByLabel("Şifre", { exact: true })).toHaveAttribute("type", "password");
  await expect(page.getByLabel("Ad Soyad", { exact: true })).toBeVisible();
});

test("şifre sıfırlamada sunucu hatası ve tekrar deneme", async ({ page }) => {
  let attempts = 0;
  await page.route("**/api/auth/forgot-password", (route) => {
    attempts++;
    return route.fulfill({ status: attempts === 1 ? 503 : 200, contentType: "application/json", body: JSON.stringify(attempts === 1 ? { error: "Lütfen tekrar deneyin" } : { message: "E-posta adresinizi kontrol edin." }) });
  });
  await page.goto("/auth");
  await page.getByRole("button", { name: "Şifremi unuttum" }).click();
  await page.getByLabel("E-posta Adresi", { exact: true }).fill("test@example.com");
  await page.getByRole("button", { name: "Sıfırlama bağlantısı gönder" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Lütfen tekrar deneyin");
  await page.getByRole("button", { name: "Sıfırlama bağlantısı gönder" }).click();
  await expect(page.getByText("E-posta adresinizi kontrol edin.")).toHaveCount(1);
});

test("plan penceresi erişilebilir, kart bilgisi toplamaz ve Escape ile kapanır", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 650 });
  await page.goto("/pricing");
  const trigger = page.getByRole("button", { name: "Planı Seç", exact: true }).first();
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Plan bilgileri" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("textbox")).toHaveCount(0);
  const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "best-practice"]).analyze();
  expect(audit.violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("üretim derlemesinde simülasyon endpoint'i kapalıdır", async ({ request }) => {
  const response = await request.post("/api/checkout/simulate", { data: { plan: "team" } });
  expect(response.status()).toBe(403);
});

for (const route of ["/dashboard", "/dashboard/new", "/dashboard/settings", "/dashboard/instagram"]) {
  test(route + " oturum olmadan açılmaz", async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveURL(/\/auth(?:\?|$)/);
  });
}

test("bilinmeyen sayfa doğru 404 yanıtı döndürür", async ({ page }) => {
  const response = await page.goto("/legal/unknown-document");
  expect(response?.status()).toBe(404);
});
