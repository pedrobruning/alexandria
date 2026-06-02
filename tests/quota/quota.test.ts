import { describe, expect, it } from "vitest";
import {
  QUOTA_WINDOW_DAYS,
  SERVER_KEY_BRANCH_LIMIT,
  checkQuota,
  windowStart,
} from "@/domains/quota/domain/quota";

describe("checkQuota", () => {
  it("allows a server-key branch below the limit", () => {
    expect(checkQuota({ used: 0, usedServerKey: true })).toEqual({ allowed: true });
    expect(checkQuota({ used: SERVER_KEY_BRANCH_LIMIT - 1, usedServerKey: true })).toEqual({
      allowed: true,
    });
  });

  it("denies a server-key branch at or past the limit, reporting the limit", () => {
    expect(checkQuota({ used: SERVER_KEY_BRANCH_LIMIT, usedServerKey: true })).toEqual({
      allowed: false,
      reason: "quota_exceeded",
      limit: SERVER_KEY_BRANCH_LIMIT,
    });
  });

  it("always allows BYOK generations regardless of usage", () => {
    expect(checkQuota({ used: SERVER_KEY_BRANCH_LIMIT + 999, usedServerKey: false })).toEqual({
      allowed: true,
    });
  });

  it("honors a custom limit", () => {
    expect(checkQuota({ used: 5, usedServerKey: true, limit: 5 })).toEqual({
      allowed: false,
      reason: "quota_exceeded",
      limit: 5,
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
