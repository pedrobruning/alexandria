// Must match the Supabase project's Email OTP Length setting.
export const OTP_LENGTH = 8;

export function normalizeOtp(input: string): string {
  return input.replace(/\D/g, "").slice(0, OTP_LENGTH);
}

export function isCompleteOtp(code: string): boolean {
  return code.length === OTP_LENGTH && /^\d+$/.test(code);
}
