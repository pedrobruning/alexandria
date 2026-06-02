import { describe, expect, it } from "vitest";
import { parseGeneration } from "@/domains/generation/domain/parse";

describe("parseGeneration", () => {
  it("parses a clean JSON object", () => {
    const out = parseGeneration('{"title":"The Sealed Stair","content":"A passage.","summary":"A short summary."}');
    expect(out).toEqual({ title: "The Sealed Stair", content: "A passage.", summary: "A short summary." });
  });

  it("parses JSON wrapped in prose or code fences", () => {
    const raw = 'Sure!\n```json\n{"title":"Body","content":"Body text.","summary":"Sum."}\n```';
    expect(parseGeneration(raw)).toEqual({ title: "Body", content: "Body text.", summary: "Sum." });
  });

  it("derives a summary when none is provided", () => {
    const out = parseGeneration('{"content":"First sentence. Second sentence."}');
    expect(out.content).toBe("First sentence. Second sentence.");
    expect(out.summary).toBe("First sentence.");
  });

  it("derives a short title from the summary when none is provided", () => {
    const out = parseGeneration('{"content":"The desert kept its promise tonight.","summary":"The desert kept its promise."}');
    expect(out.title).toBe("The desert kept its");
  });

  it("falls back to treating non-JSON text as the passage", () => {
    const out = parseGeneration("Just raw prose with no JSON at all.");
    expect(out.content).toBe("Just raw prose with no JSON at all.");
    expect(out.summary).toBe("Just raw prose with no JSON at all.");
    expect(out.title).toBe("Just raw prose with");
  });

  it("truncates a derived summary that has no sentence boundary", () => {
    const long = "x".repeat(200);
    const out = parseGeneration(long);
    expect(out.summary.endsWith("...")).toBe(true);
    expect(out.summary.length).toBeLessThanOrEqual(140);
  });

  it("throws on empty input", () => {
    expect(() => parseGeneration("   ")).toThrow(/empty/);
  });
});
