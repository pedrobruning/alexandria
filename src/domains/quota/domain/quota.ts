// Cost guardrail: a user may generate at most SERVER_KEY_BRANCH_LIMIT passages
// per rolling QUOTA_WINDOW_DAYS window on the shared server key. Pure logic —
// the node count comes from infrastructure.

export const SERVER_KEY_BRANCH_LIMIT = 20;
export const QUOTA_WINDOW_DAYS = 30;

export type QuotaDecision =
  | { allowed: true }
  | { allowed: false; reason: "quota_exceeded"; limit: number };

export function checkQuota(input: { used: number; limit?: number }): QuotaDecision {
  const limit = input.limit ?? SERVER_KEY_BRANCH_LIMIT;
  if (input.used < limit) return { allowed: true };
  return { allowed: false, reason: "quota_exceeded", limit };
}

// Cutoff timestamp for the rolling window: count nodes created at or after this
// instant. Does not mutate the input.
export function windowStart(now: Date, days = QUOTA_WINDOW_DAYS): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

// Server-key branches the user may still spend in the current window. Clamped at
// zero so an over-count never reports a negative allowance.
export function remainingQuota(used: number, limit = SERVER_KEY_BRANCH_LIMIT): number {
  return Math.max(0, limit - used);
}
