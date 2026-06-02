import { describe, expect, it } from "vitest";
import { isCompleteOtp, normalizeOtp, OTP_LENGTH } from "../../src/lib/auth/otp";

const full = "1".repeat(OTP_LENGTH);
const tooLong = "1".repeat(OTP_LENGTH + 4);
const tooShort = "1".repeat(OTP_LENGTH - 1);

describe("normalizeOtp", () => {
  it("strips spaces and non-digits", () => {
    expect(normalizeOtp("729 481")).toBe("729481");
    expect(normalizeOtp("7-2-9")).toBe("729");
  });

  it("caps at OTP_LENGTH digits", () => {
    expect(normalizeOtp(tooLong)).toBe(full);
  });

  it("returns empty for no digits", () => {
    expect(normalizeOtp("abc")).toBe("");
  });
});

describe("isCompleteOtp", () => {
  it("is true only for exactly OTP_LENGTH digits", () => {
    expect(isCompleteOtp(full)).toBe(true);
    expect(isCompleteOtp(tooShort)).toBe(false);
    expect(isCompleteOtp("")).toBe(false);
  });
});
