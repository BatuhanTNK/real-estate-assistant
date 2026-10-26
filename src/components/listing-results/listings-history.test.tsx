import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ListingsHistory, type ListingSummary } from "./listings-history";

const mocks = vi.hoisted(() => ({ range: vi.fn(), remove: vi.fn(), refresh: vi.fn(), toastError: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh, push: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { error: mocks.toastError, success: vi.fn() } }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({
  from: () => ({
    select: () => ({ order: () => ({ range: mocks.range }) }),
    delete: () => ({ eq: mocks.remove }),
  }),
}) }));

const listing = (id: string, type: string, text: string): ListingSummary => ({ id, property_type: type, output_kisa: text, created_at: "2026-10-26T12:00:00Z", is_favorite: false });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.range.mockResolvedValue({ data: [], error: null });
  mocks.remove.mockResolvedValue({ error: null });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("Listing history interactions", () => {
  it("matches Turkish and legacy property names in the same filter", () => {
    render(<ListingsHistory initialListings={[listing("1", "İşyeri", "Kadıköy ofis"), listing("2", "isyeri", "Ataşehir ofis"), listing("3", "Daire", "Konut")]} totalCount={3} />);
    fireEvent.change(screen.getByRole("combobox", { name: "Mülk tipi filtre" }), { target: { value: "isyeri" } });
    expect(screen.getByText("Kadıköy ofis")).toBeVisible();
    expect(screen.getByText("Ataşehir ofis")).toBeVisible();
    expect(screen.queryByText("Konut")).not.toBeInTheDocument();
  });

  it("searches Turkish capital İ correctly", () => {
    render(<ListingsHistory initialListings={[listing("1", "Daire", "İSTANBUL manzaralı")]} totalCount={1} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "istanbul" } });
    expect(screen.getByText("İSTANBUL manzaralı")).toBeVisible();
  });

  it("updates the favorite filter immediately after a change", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ is_favorite: true })).mockResolvedValueOnce(Response.json({ is_favorite: false }));
    vi.stubGlobal("fetch", fetchMock);
    render(<ListingsHistory initialListings={[listing("1", "Daire", "Favori adayım")]} totalCount={1} />);
    fireEvent.click(screen.getByRole("button", { name: "Favorilere ekle" }));
    await screen.findByRole("button", { name: "Favoriler (1)" });
    fireEvent.click(screen.getByRole("button", { name: "Favoriler (1)" }));
    fireEvent.click(screen.getByRole("button", { name: "Favorilerden çıkar" }));
    await waitFor(() => expect(screen.queryByText("Favori adayım")).not.toBeInTheDocument());
  });

  it("removes a deleted listing immediately after confirmation", async () => {
    render(<ListingsHistory initialListings={[listing("1", "Daire", "Silinecek ilan")]} totalCount={1} />);
    fireEvent.click(screen.getByRole("button", { name: "İlanı sil" }));
    fireEvent.click(screen.getByRole("button", { name: "Evet" }));
    await waitFor(() => expect(screen.queryByText("Silinecek ilan")).not.toBeInTheDocument());
    expect(mocks.remove).toHaveBeenCalledWith("id", "1");
  });

  it("keeps pagination available when a filter has no loaded matches", () => {
    render(<ListingsHistory initialListings={[listing("1", "Daire", "İlk kayıt")]} totalCount={21} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "henüz yüklenmeyen" } });
    expect(screen.getByRole("button", { name: "Daha fazla yükle (1/21)" })).toBeVisible();
  });

  it("reports paging failures and allows a retry", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.range.mockResolvedValue({ data: null, error: { message: "Offline" } });
    render(<ListingsHistory initialListings={[listing("1", "Daire", "İlk kayıt")]} totalCount={21} />);
    fireEvent.click(screen.getByRole("button", { name: "Daha fazla yükle (1/21)" }));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Daha fazla yükle (1/21)" })).toBeEnabled();
  });
});
