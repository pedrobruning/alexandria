import { describe, expect, it } from "vitest";
import {
  MAX_REWARDED_REFERRALS,
  REFERRAL_CODE_LENGTH,
  REFERRAL_QUALIFY_NODES,
  REFERRAL_REWARD_CREDITS,
  generateReferralCode,
  isReferralCode,
} from "@/domains/referrals/domain/referrals";

describe("referral constants", () => {
  it("mirror the values inlined in migration 0007", () => {
    expect(REFERRAL_REWARD_CREDITS).toBe(10);
    expect(REFERRAL_QUALIFY_NODES).toBe(10);
    expect(MAX_REWARDED_REFERRALS).toBe(5);
    expect(REFERRAL_CODE_LENGTH).toBe(8);
  });
});

describe("generateReferralCode", () => {
  const ALPHABET = /^[0-9A-HJKMNP-TV-Z]+$/; // Crockford base32 (no I, L, O, U)

  it("returns a code of the default length", () => {
    expect(generateReferralCode()).toHaveLength(REFERRAL_CODE_LENGTH);
  });

  it("honors a custom length", () => {
    expect(generateReferralCode(12)).toHaveLength(12);
  });

  it("uses only unambiguous base32 characters", () => {
    for (let i = 0; i < 100; i++) {
      expect(generateReferralCode()).toMatch(ALPHABET);
    }
  });

  it("is effectively unique across many draws", () => {
    const draws = new Set<string>();
    for (let i = 0; i < 1000; i++) draws.add(generateReferralCode());
    expect(draws.size).toBe(1000);
  });
});

describe("isReferralCode", () => {
  it("accepts a freshly generated code", () => {
    expect(isReferralCode(generateReferralCode())).toBe(true);
  });

  it("rejects the wrong length", () => {
    expect(isReferralCode("ABC")).toBe(false);
    expect(isReferralCode("ABCDEFGHJ")).toBe(false);
  });

  it("rejects ambiguous or out-of-charset characters", () => {
    expect(isReferralCode("ILOUABCD")).toBe(false); // I, L, O, U excluded
    expect(isReferralCode("abcdefgh")).toBe(false); // lowercase
    expect(isReferralCode("ABCD-EFG")).toBe(false);
  });
});
