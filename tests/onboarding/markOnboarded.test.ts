import { describe, expect, it } from "vitest";
import { markOnboarded, type OnboardingWriter } from "@/domains/identity/application/markOnboarded";

function fakeWriter(existing: string | null): { writer: OnboardingWriter; setCalls: string[] } {
  const setCalls: string[] = [];
  const writer: OnboardingWriter = {
    async getOnboardedAt() {
      return existing;
    },
    async setOnboardedAt(userId) {
      setCalls.push(userId);
    },
  };
  return { writer, setCalls };
}

describe("markOnboarded", () => {
  it("sets onboarded_at when the user has never been onboarded", async () => {
    const { writer, setCalls } = fakeWriter(null);
    await markOnboarded(writer, "user-1");
    expect(setCalls).toEqual(["user-1"]);
  });

  it("preserves the first completion timestamp — no overwrite on a re-call", async () => {
    const { writer, setCalls } = fakeWriter("2026-06-01T00:00:00Z");
    await markOnboarded(writer, "user-1");
    expect(setCalls).toEqual([]);
  });
});
