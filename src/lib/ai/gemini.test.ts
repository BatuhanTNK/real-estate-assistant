import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateWithGemini } from "./gemini";

/**
 * Gemini API çağrısı aracılığıyla fetch kullanır. Burada fetch'i mock'layıp:
 * - JSON fence stripping (```json ... ```)
 * - eksik / bozuk alan tespiti
 * - HTTP hatası
 * - API key yokluğu
 * - boş candidates
 * davranışlarını doğruluyoruz.
 */

function geminiResponse(text: string, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    json: async () => ({
      candidates: [{ content: { parts: [{ text }] } }],
    }),
    text: async () => "server error body",
  };
}

describe("generateWithGemini", () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fence'li JSON yanıtını doğru parse eder", async () => {
    const fenced = "```json\n{\"resmi\":\"r\",\"samimi\":\"s\",\"kisa\":\"k\"}\n```";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(geminiResponse(fenced)));

    const out = await generateWithGemini("prompt");
    expect(out).toEqual({ resmi: "r", samimi: "s", kisa: "k" });
  });

  it("fencesiz JSON yanıtını da parse eder", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        geminiResponse('{"resmi":"r","samimi":"s","kisa":"k"}')
      )
    );
    const out = await generateWithGemini("prompt");
    expect(out.kisa).toBe("k");
  });

  it("eksik alan (resmi yok) 'beklenen formatta değil' hatası", async () => {
    // gemini.ts: eksik alan kontrolü catch{} içinde sarmalandığı için
    // dışarıya "AI yanıtı beklenen formatta değil" çıkar (parse gibi işlenir).
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        geminiResponse('{"samimi":"s","kisa":"k"}')
      )
    );
    await expect(generateWithGemini("p")).rejects.toThrow(
      /beklenen formatta değil/
    );
  });

  it("bozuk JSON hatası", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(geminiResponse("bu json değil {"))
    );
    await expect(generateWithGemini("p")).rejects.toThrow(
      /beklenen formatta değil/
    );
  });

  it("HTTP hatası (response.ok=false) hatası", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(geminiResponse("", false)));
    await expect(generateWithGemini("p")).rejects.toThrow(/Gemini API hatası: 500/);
  });

  it("GEMINI_API_KEY yoksa hatası", async () => {
    delete process.env.GEMINI_API_KEY;
    vi.stubGlobal("fetch", vi.fn());
    await expect(generateWithGemini("p")).rejects.toThrow(
      /GEMINI_API_KEY environment variable/
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("boş candidates hatası", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ candidates: [] }),
      })
    );
    await expect(generateWithGemini("p")).rejects.toThrow(/boş yanıt/);
  });
});
