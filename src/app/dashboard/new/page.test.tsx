import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NewListingPage from "./page";

const mocks = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("sonner", () => ({ toast: { error: mocks.error, success: mocks.success } }));
vi.mock("@/components/listing-results/result-cards", () => ({ ResultCards: ({ result }: { result: { resmi: string } }) => <div>{result.resmi}</div> }));
beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal("fetch", vi.fn()); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

async function fillBasics() {
  fireEvent.click(screen.getByRole("combobox", { name: "Mülk Tipi *" }));
  fireEvent.click(await screen.findByRole("option", { name: /Daire/ }));
  fireEvent.click(screen.getByRole("combobox", { name: "İlan Türü *" }));
  fireEvent.click(await screen.findByRole("option", { name: "Satılık" }));
  fireEvent.change(screen.getByLabelText("İl", { exact: true }), { target: { value: "İstanbul" } });
  fireEvent.change(screen.getByLabelText("İlçe", { exact: true }), { target: { value: "Kadıköy" } });
  fireEvent.change(screen.getByLabelText("Fiyat (TL) *"), { target: { value: "4500000" } });
}

describe("New listing wizard", () => {
  it("does not generate from an incomplete or whitespace-only first step", async () => {
    const { container } = render(<NewListingPage />);
    expect(screen.getByRole("button", { name: "İleri" })).toBeDisabled();
    await fillBasics();
    fireEvent.change(screen.getByLabelText("İl", { exact: true }), { target: { value: "  " } });
    expect(screen.getByRole("button", { name: "İleri" })).toBeDisabled();
    fireEvent.submit(container.querySelector("form")!);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("treats Enter on step one as navigation, not a generation request", async () => {
    const { container } = render(<NewListingPage />);
    await fillBasics();
    fireEvent.submit(container.querySelector("form")!);
    expect(await screen.findByText("Daire Detayları")).toBeVisible();
    expect(screen.getByLabelText("Net m²")).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows generated results only after all steps and keeps quota errors recoverable", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ error: "Limit", limitReached: true }, { status: 429 }))
      .mockResolvedValueOnce(Response.json({ result: { resmi: "Üretilen resmi metin", samimi: "S", kisa: "K" }, remainingCount: null }));
    vi.stubGlobal("fetch", fetchMock);
    render(<NewListingPage />);
    await fillBasics();
    fireEvent.click(screen.getByRole("button", { name: "İleri" }));
    fireEvent.click(screen.getByRole("button", { name: "İleri" }));
    fireEvent.change(screen.getByLabelText("Telefon Numarası"), { target: { value: "05321112233" } });
    fireEvent.click(screen.getByRole("button", { name: "İlan Metni Oluştur" }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("Aylık limitinize ulaştınız", expect.any(Object)));
    expect(screen.getByRole("button", { name: "İlan Metni Oluştur" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "İlan Metni Oluştur" }));
    await screen.findByText("Üretilen resmi metin");
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload).toMatchObject({ propertyType: "Daire", ilanTuru: "Satılık", location: { il: "İstanbul", ilce: "Kadıköy" }, contactPhone: "05321112233" });
    expect(mocks.success).toHaveBeenCalledWith(expect.any(String), { description: "Sınırsız planınızla devam edebilirsiniz." });
  });
});
