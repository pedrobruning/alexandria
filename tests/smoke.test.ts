import { describe, expect, it } from "vitest";

// Harness smoke test — confirms Vitest + path aliases run. Replaced by real
// domain tests in later tasks.
describe("test harness", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
