import { describe, expect, it } from "vitest";
import { parseGeneration } from "@/domains/generation/domain/parse";

describe("parseGeneration", () => {
  it("parses a clean JSON object", () => {
    const out = parseGeneration('{"content":"A passage.","summary":"A short summary."}');
    expect(out).toEqual({ content: "A passage.", summary: "A short summary." });
  });

  it("parses JSON wrapped in prose or code fences", () => {
    const raw = 'Sure!\n```json\n{"content":"Body text.","summary":"Sum."}\n```';
    expect(parseGeneration(raw)).toEqual({ content: "Body text.", summary: "Sum." });
  });

  it("derives a summary when none is provided", () => {
    const out = parseGeneration('{"content":"First sentence. Second sentence."}');
    expect(out.content).toBe("First sentence. Second sentence.");
    expect(out.summary).toBe("First sentence.");
  });

  it("falls back to treating non-JSON text as the passage", () => {
    const out = parseGeneration("Just raw prose with no JSON at all.");
    expect(out.content).toBe("Just raw prose with no JSON at all.");
    expect(out.summary).toBe("Just raw prose with no JSON at all.");
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
