// Referral program constants. These mirror the values inlined in migration
// 0007_referrals.sql — the trigger enforces them in SQL; keep both in sync.

export const REFERRAL_REWARD_CREDITS = 10; // bonus credits granted per qualified referral
export const REFERRAL_QUALIFY_NODES = 10; // qualifying nodes an invitee must write
export const MAX_REWARDED_REFERRALS = 5; // most referrals one user can be rewarded for
export const REFERRAL_CODE_LENGTH = 8;

// Crockford base32: digits + uppercase letters minus I, L, O, U (visual ambiguity).
// 32 symbols divide 256 evenly, so a byte modulo 32 is unbiased.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function generateReferralCode(length = REFERRAL_CODE_LENGTH): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let code = "";
  for (const byte of bytes) code += ALPHABET[byte % ALPHABET.length];
  return code;
}

// Name of the short-lived cookie that carries a referral code across the
// magic-link round trip, from /r/[code] to the auth callback.
export const REFERRAL_COOKIE = "referral_code";

const CODE_PATTERN = /^[0-9A-HJKMNP-TV-Z]+$/;

// Whether a raw path segment is a well-formed referral code. Validates before
// it ever reaches a cookie or the DB so a junk link can't poison the round trip.
export function isReferralCode(value: string): boolean {
  return value.length === REFERRAL_CODE_LENGTH && CODE_PATTERN.test(value);
}
