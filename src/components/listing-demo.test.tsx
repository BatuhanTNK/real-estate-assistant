import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ListingDemo } from "./listing-demo";

afterEach(() => { cleanup(); Reflect.deleteProperty(navigator, "clipboard"); vi.restoreAllMocks(); });

describe("ListingDemo clipboard feedback", () => {
  it("copies the selected tone and confirms success", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<ListingDemo />);
    fireEvent.click(screen.getByRole("button", { name: "Kısa" }));
    fireEvent.click(screen.getByRole("button", { name: "Örnek metni kopyala" }));
    await screen.findByRole("button", { name: "Metin kopyalandı" });
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Satış fiyatı: 4.500.000 TL."));
  });

  it("does not mark another tone copied when an earlier request finishes", async () => {
    let finish!: () => void;
    const writeText = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<ListingDemo />);
    fireEvent.click(screen.getByRole("button", { name: "Örnek metni kopyala" }));
    fireEvent.click(screen.getByRole("button", { name: "Samimi" }));
    await act(async () => { finish(); });
    expect(screen.getByRole("button", { name: "Örnek metni kopyala" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Metin kopyalandı" })).not.toBeInTheDocument();
  });

  it("shows a useful fallback when clipboard permission is denied", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("Denied"));
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<ListingDemo />);
    fireEvent.click(screen.getByRole("button", { name: "Örnek metni kopyala" }));
    await waitFor(() => expect(screen.getByText(/Metni seçerek kopyalayabilirsiniz/)).toBeVisible());
    expect(screen.getByRole("button", { name: "Örnek metni kopyala" })).toBeEnabled();
  });
});
