import { describe, expect, it } from "vitest";
import { assembleAncestors } from "@/domains/generation/domain/ancestors";

describe("assembleAncestors", () => {
  it("collects all summaries and the immediate parent's full text", () => {
    const ctx = assembleAncestors([
      { summary: "Root summary", content: "Root text" },
      { summary: "Child summary", content: "Child text" },
      { summary: "Parent summary", content: "Parent text" },
    ]);
    expect(ctx.summaries).toEqual(["Root summary", "Child summary", "Parent summary"]);
    expect(ctx.lastPassage).toBe("Parent text");
  });

  it("throws on an empty path", () => {
    expect(() => assembleAncestors([])).toThrow(/requires a parent/);
  });
});
