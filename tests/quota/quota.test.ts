import { describe, expect, it } from "vitest";
import {
  QUOTA_WINDOW_DAYS,
  SERVER_KEY_BRANCH_LIMIT,
  checkQuota,
  decideGeneration,
  remainingQuota,
  windowStart,
} from "@/domains/quota/domain/quota";

describe("checkQuota", () => {
  it("allows a generation below the limit", () => {
    expect(checkQuota({ used: 0 })).toEqual({ allowed: true });
    expect(checkQuota({ used: SERVER_KEY_BRANCH_LIMIT - 1 })).toEqual({ allowed: true });
  });

  it("denies a generation at or past the limit, reporting the limit", () => {
    expect(checkQuota({ used: SERVER_KEY_BRANCH_LIMIT })).toEqual({
      allowed: false,
      reason: "quota_exceeded",
      limit: SERVER_KEY_BRANCH_LIMIT,
    });
  });

  it("honors a custom limit", () => {
    expect(checkQuota({ used: 5, limit: 5 })).toEqual({
      allowed: false,
      reason: "quota_exceeded",
      limit: 5,
    });
  });
});

describe("remainingQuota", () => {
  it("returns the unspent allowance below the limit", () => {
    expect(remainingQuota(0)).toBe(SERVER_KEY_BRANCH_LIMIT);
    expect(remainingQuota(8)).toBe(SERVER_KEY_BRANCH_LIMIT - 8);
  });

  it("clamps at zero once the limit is reached or exceeded", () => {
    expect(remainingQuota(SERVER_KEY_BRANCH_LIMIT)).toBe(0);
    expect(remainingQuota(SERVER_KEY_BRANCH_LIMIT + 5)).toBe(0);
  });

  it("honors a custom limit", () => {
    expect(remainingQuota(2, 5)).toBe(3);
  });
});

describe("decideGeneration", () => {
  it("allows below the base limit without spending a credit", () => {
    expect(decideGeneration({ used: 0, bonusCredits: 0 })).toEqual({
      allowed: true,
      spendCredit: false,
    });
    expect(
      decideGeneration({ used: SERVER_KEY_BRANCH_LIMIT - 1, bonusCredits: 7 }),
    ).toEqual({ allowed: true, spendCredit: false });
  });

  it("draws on a bonus credit once the base limit is reached", () => {
    expect(
      decideGeneration({ used: SERVER_KEY_BRANCH_LIMIT, bonusCredits: 1 }),
    ).toEqual({ allowed: true, spendCredit: true });
    expect(
      decideGeneration({ used: SERVER_KEY_BRANCH_LIMIT + 4, bonusCredits: 3 }),
    ).toEqual({ allowed: true, spendCredit: true });
  });

  it("denies when the base limit is reached and no credits remain", () => {
    expect(
      decideGeneration({ used: SERVER_KEY_BRANCH_LIMIT, bonusCredits: 0 }),
    ).toEqual({ allowed: false, spendCredit: false });
  });

  it("honors a custom base limit", () => {
    expect(decideGeneration({ used: 5, bonusCredits: 2, baseLimit: 5 })).toEqual({
      allowed: true,
      spendCredit: true,
    });
    expect(decideGeneration({ used: 4, bonusCredits: 0, baseLimit: 5 })).toEqual({
      allowed: true,
      spendCredit: false,
    });
  });
});

describe("windowStart", () => {
  it("returns the cutoff QUOTA_WINDOW_DAYS before now", () => {
    const now = new Date("2026-06-02T00:00:00.000Z");
    const start = windowStart(now);
    const expected = new Date("2026-05-03T00:00:00.000Z");
    expect(start.toISOString()).toBe(expected.toISOString());
    expect(QUOTA_WINDOW_DAYS).toBe(30);
  });

  it("does not mutate the input date", () => {
    const now = new Date("2026-06-02T00:00:00.000Z");
    windowStart(now);
    expect(now.toISOString()).toBe("2026-06-02T00:00:00.000Z");
  });
});
