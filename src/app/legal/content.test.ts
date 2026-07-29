import { describe, expect, it } from "vitest";
import {
  legalDocs,
  legalDocIds,
  type LegalDocId,
  isLegalDocId,
  legalMetadata,
} from "./content";

const EXPECTED_IDS: LegalDocId[] = ["contact", "privacy", "terms"];

describe("legalDocs — yapı bütünlüğü", () => {
  it("3 doküman mevcut (contact, privacy, terms)", () => {
    expect(legalDocIds.sort()).toEqual([...EXPECTED_IDS].sort());
  });

  for (const id of EXPECTED_IDS) {
    it(`${id}: title ve description boş değil`, () => {
      const doc = legalDocs[id];
      expect(doc.title.length).toBeGreaterThan(0);
      expect(doc.description.length).toBeGreaterThan(0);
    });

    it(`${id}: en az bir bölüm ve gövde paragrafı var`, () => {
      const doc = legalDocs[id];
      expect(doc.sections.length).toBeGreaterThan(0);
      for (const s of doc.sections) {
        expect(s.heading.length).toBeGreaterThan(0);
        expect(s.body.length).toBeGreaterThan(0);
        for (const p of s.body) expect(p.length).toBeGreaterThan(0);
      }
    });

    it(`${id}: lastUpdated tarihi formatlı`, () => {
      expect(legalDocs[id].lastUpdated).toMatch(/\d+ \w+ \d{4}/);
    });
  }
});

describe("isLegalDocId", () => {
  it("geçerli ID'ler true döner", () => {
    for (const id of EXPECTED_IDS) expect(isLegalDocId(id)).toBe(true);
  });

  it("geçersiz ID false", () => {
    expect(isLegalDocId("kale")).toBe(false);
    expect(isLegalDocId("")).toBe(false);
  });
});

describe("legalMetadata", () => {
  it("title '— İlan Asistanı' sonekiyle döner", () => {
    const m = legalMetadata("privacy");
    expect(m.title).toContain("Gizlilik");
    expect(m.title).toContain("İlan Asistanı");
  });

  for (const id of EXPECTED_IDS) {
    it(`${id}: description dokümanla birebir`, () => {
      expect(legalMetadata(id).description).toBe(legalDocs[id].description);
    });
  }
});
