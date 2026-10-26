import { test, expect } from "@playwright/test";

/**
 * Statik rota E2E testleri — env/DB gerektirmeyen yollar.
 * (auth + ilan üretimi kapsam dışı.)
 *
 * Not: config 3100 portunda kendi prod build'imizi başlatır; bu yüzden
 * geliştirme makinesindeki :3000'deki başka uygulama ile çakışmaz.
 */

const LEGAL = [
  { type: "contact", title: "İletişim" },
  { type: "privacy", title: "Gizlilik Politikası" },
  { type: "terms", title: "Kullanım Şartları" },
] as const;

test.describe("Landing — /", () => {
  test("hero başlığı ve CTA görünür", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Emlak İlan Metninizi Saniyeler İçinde Oluşturun/,
      })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Ücretsiz Dene" }).first()
    ).toBeVisible();
  });
});

test.describe("Fiyatlandırma — /pricing", () => {
  test("plan kartları (Bireysel, Ofis) görünür", async ({ page }) => {
    await page.goto("/pricing");
    // exact: true → "Emlak ofisleri için" gibi alt-string eşleşmelerini eler.
    await expect(page.getByText("Bireysel", { exact: true })).toBeVisible();
    await expect(page.getByText("Ofis", { exact: true })).toBeVisible();
  });
});

test.describe("Yasal sayfalar — /legal/:type", () => {
  for (const { type, title } of LEGAL) {
    test(`/legal/${type} başlık içerir`, async ({ page }) => {
      await page.goto(`/legal/${type}`);
      await expect(page.getByRole("heading", { level: 1, name: title, exact: true })).toBeVisible();
    });
  }
});

test.describe("Footer navigasyonu", () => {
  for (const { type, title } of LEGAL) {
    test(`footer ${type} linki ilgili sayfaya gider`, async ({ page }) => {
      await page.goto("/");
      await page.getByRole("link", { name: title }).click();
      await expect(page).toHaveURL(`/legal/${type}`);
    });
  }
});
