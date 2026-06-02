import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/auth/safeRedirect";

describe("safeNextPath", () => {
  it("accepts same-origin relative paths", () => {
    expect(safeNextPath("/stories")).toBe("/stories");
    expect(safeNextPath("/stories/abc-123")).toBe("/stories/abc-123");
  });

  it("falls back to /stories for missing or empty input", () => {
    expect(safeNextPath(null)).toBe("/stories");
    expect(safeNextPath("")).toBe("/stories");
  });

  it("rejects off-origin targets", () => {
    expect(safeNextPath("@evil.com")).toBe("/stories");
    expect(safeNextPath(".evil.com")).toBe("/stories");
    expect(safeNextPath("//evil.com")).toBe("/stories");
    expect(safeNextPath("/\\evil.com")).toBe("/stories");
    expect(safeNextPath("https://evil.com")).toBe("/stories");
    expect(safeNextPath("stories")).toBe("/stories");
  });
});
