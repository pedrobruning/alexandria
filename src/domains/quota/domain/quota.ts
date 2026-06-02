// Cost guardrail (Locked Decision 4): a user may spend the shared server key on
// at most SERVER_KEY_BRANCH_LIMIT branches per rolling QUOTA_WINDOW_DAYS window.
// BYOK generations are exempt. Pure logic — the node count comes from infrastructure.

export const SERVER_KEY_BRANCH_LIMIT = 20;
export const QUOTA_WINDOW_DAYS = 30;

export type QuotaDecision =
  | { allowed: true }
  | { allowed: false; reason: "quota_exceeded"; limit: number };

export function checkQuota(input: {
  used: number;
  usedServerKey: boolean;
  limit?: number;
}): QuotaDecision {
  if (!input.usedServerKey) return { allowed: true };
  const limit = input.limit ?? SERVER_KEY_BRANCH_LIMIT;
  if (input.used < limit) return { allowed: true };
  return { allowed: false, reason: "quota_exceeded", limit };
}

// Cutoff timestamp for the rolling window: count server-key nodes created at or
// after this instant. Does not mutate the input.
export function windowStart(now: Date, days = QUOTA_WINDOW_DAYS): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}
