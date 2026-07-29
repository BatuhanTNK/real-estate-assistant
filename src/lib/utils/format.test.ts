import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  getPropertyTypeLabel,
} from "./format";

describe("formatCurrency", () => {
  it("15000000 -> ₺15.000.000 (tr-TR, 0 ondalık)", () => {
    expect(formatCurrency(15000000)).toBe("₺15.000.000");
  });

  it("129 -> ₺129", () => {
    expect(formatCurrency(129)).toBe("₺129");
  });

  it("0 -> ₺0", () => {
    expect(formatCurrency(0)).toBe("₺0");
  });
});

describe("formatDate", () => {
  it("ISO tarihi Türkçe uzun formata çevirir", () => {
    const out = formatDate("2026-07-28T10:00:00Z");
    expect(out).toContain("2026");
    expect(out).toContain("Temmuz");
    expect(out).toContain("28");
  });
});

describe("formatDateShort", () => {
  it("NN.NN.YYYY formatına çevirir", () => {
    const out = formatDateShort("2026-07-28T10:00:00Z");
    expect(out).toMatch(/2026/);
    expect(out).toMatch(/07/);
    expect(out).toMatch(/28/);
  });
});

describe("getPropertyTypeLabel", () => {
  it("lowercase key'leri etikete çevirir", () => {
    expect(getPropertyTypeLabel("daire")).toBe("Daire");
    expect(getPropertyTypeLabel("villa")).toBe("Villa");
    expect(getPropertyTypeLabel("arsa")).toBe("Arsa");
    expect(getPropertyTypeLabel("isyeri")).toBe("İşyeri");
    expect(getPropertyTypeLabel("diger")).toBe("Diğer");
  });

  it("bilinmeyen key aynı string döner", () => {
    expect(getPropertyTypeLabel("kale")).toBe("kale");
  });
});
