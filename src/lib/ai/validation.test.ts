import { describe, expect, it } from "vitest";
import { validateListingForm } from "./validation";

/** Geçerli en küçük payload — zorunlu alanlar dahil. */
function validPayload(): Record<string, unknown> {
  return {
    propertyType: "Daire",
    ilanTuru: "Satılık",
    location: { il: "İstanbul", ilce: "Kadıköy" },
    price: "15.000.000",
  };
}

describe("validateListingForm — geçerli girdi", () => {
  it("minimal geçerli payload kabul edilir", () => {
    const res = validateListingForm(validPayload());
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.propertyType).toBe("Daire");
      expect(res.data.ilanTuru).toBe("Satılık");
      expect(res.data.location.il).toBe("İstanbul");
      expect(res.data.price).toBe("15.000.000");
    }
  });

  it("opsiyonel array alanları eksikse default [] gelir", () => {
    const res = validateListingForm(validPayload());
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.yakinCevre).toEqual([]);
      expect(res.data.ozellikler).toEqual([]);
      expect(res.data.altyapi).toEqual([]);
    }
  });
});

describe("validateListingForm — geçersiz girdi", () => {
  it("propertyType eksikse reddeder ve mesaj yolu içerir", () => {
    const p = validPayload();
    delete p.propertyType;
    const res = validateListingForm(p);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("propertyType");
  });

  it("propertyType geçersiz enum değeriyse reddeder", () => {
    const res = validateListingForm({ ...validPayload(), propertyType: "Kale" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("propertyType");
  });

  it("ilanTuru geçersiz enum reddeder", () => {
    const res = validateListingForm({ ...validPayload(), ilanTuru: "Takas" });
    expect(res.ok).toBe(false);
  });

  it("location.il çok kısa ise reddeder", () => {
    const res = validateListingForm({
      ...validPayload(),
      location: { il: "İ", ilce: "Kadıköy" },
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("location");
  });

  it("price boş string reddeder (Fiyat gerekli)", () => {
    const res = validateListingForm({ ...validPayload(), price: "" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("Fiyat gerekli");
  });
});

describe("validateListingForm — telefon formatı", () => {
  const validPhones = [
    "0532 111 22 33",
    "+90 532 111 22 33",
    "5321112233",
    "05321112233",
  ];

  for (const phone of validPhones) {
    it(`geçerli telefon kabul: ${phone}`, () => {
      const res = validateListingForm({
        ...validPayload(),
        contactPhone: phone,
      });
      expect(res.ok).toBe(true);
    });
  }

  it("geçersiz telefon reddeder (harf içeren)", () => {
    const res = validateListingForm({
      ...validPayload(),
      contactPhone: "0532 abc 22 33",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("contactPhone");
  });

  it("çok kısa telefon reddeder", () => {
    const res = validateListingForm({
      ...validPayload(),
      contactPhone: "532",
    });
    expect(res.ok).toBe(false);
  });
});

describe("validateListingForm — prompt-injection sanitizasyonu (notes)", () => {
  it("kontrol karakterleri (\\x00, \\x1B) silinir", () => {
    const res = validateListingForm({
      ...validPayload(),
      notes: "Manzaralı\x00\x1Bdaire",
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.notes).toBe("Manzaralıdaire");
      expect(res.data.notes).not.toContain("\x00");
      expect(res.data.notes).not.toContain("\x1B");
    }
  });

  it("3+ boşluk 2'ye indirgenir", () => {
    const res = validateListingForm({
      ...validPayload(),
      notes: "geniş     bahçe",
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.notes).toBe("geniş  bahçe");
      expect(res.data.notes).not.toMatch(/\s{3,}/);
    }
  });

  it("2000 karakterden uzun notes reddedilir", () => {
    const res = validateListingForm({
      ...validPayload(),
      notes: "x".repeat(2001),
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("Maksimum 2000");
  });
});

describe("validateListingForm — geriye dönük uyumluluk (metpirlareNet)", () => {
  it("hem metrekareNet hem metpirlareNet set olduğunda parse başarılı", () => {
    const res = validateListingForm({
      ...validPayload(),
      metrekareNet: "120",
      metpirlareNet: "120",
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.metrekareNet).toBe("120");
      expect(res.data.metpirlareNet).toBe("120");
    }
  });
});
