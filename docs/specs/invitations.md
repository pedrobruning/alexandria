# Spec: Invitation / Referral Flow

> Status: DRAFT — awaiting approval before implementation.
> Worktree: `../alexandria-invitations` on branch `feat/invitations`.
> Source of truth for *what* this feature is. Implementation tracked in the Tasks section.

## Objective

Let a signed-in user invite other people via a personal, shareable referral link. When an
invited user becomes genuinely active — defined as **creating at least 10 real passages
(nodes)** — the **inviter** is rewarded with **+10 one-time bonus generation credits**. Credits
top up the existing free allowance (20 generations / rolling 30 days), are **consumed once**,
and **do not renew** with the window. A user can earn the reward from at most **5** referrals
(max +50 credits lifetime).

This is the first growth mechanic in an otherwise single-player app. It must not weaken the
core security invariants (server-only key, owner-scoped RLS, immutable passages).

### User stories

- As a user, I can find my personal invite link and share it.
- As a new user, when I sign up through someone's invite link, I'm permanently attributed to
  that inviter.
- As an inviter, when one of my invitees writes their 10th real passage, I automatically
  receive +10 bonus credits — exactly once per invitee, up to 5 rewarded invitees.
- As a user who has run out of my 20/window allowance, my next generations draw from my bonus
  credit pool until it's empty, then I'm blocked (429) as before.
- As a user, I can see how many credits I have and how many invitees have qualified.

### Success criteria (specific & testable)

1. Visiting `/r/<code>` sets a referral cookie and redirects to `/login`; signing up there
   results in a `referrals` row `(invitee_id, referrer_id, status='pending')` and the new
   user's `profiles.invited_by = referrer_id`.
2. Attribution is permanent and single: a user's `invited_by` is set **once** and never
   reassigned; a given invitee appears in `referrals` at most once (PK enforces this).
3. Self-referral is impossible: `referrer_id <> invitee_id` (DB constraint).
4. When an invitee's count of qualifying nodes (`created_by = invitee`, `imported = false`,
   not in a demo story) reaches **10**, their `pending` referral flips to `rewarded` and the
   inviter's `profiles.bonus_credits` increases by exactly **10** — atomically and only once.
5. If the inviter already has 5 `rewarded` referrals, a further qualifying invitee flips to
   `capped` and grants **0** credits (the qualification is latched so it can't re-fire).
6. A generation is allowed iff `used < 20` **or** `bonus_credits > 0`. When `used >= 20` and
   the generation succeeds, exactly one bonus credit is consumed (`bonus_credits` floored at 0).
7. Bonus credits never renew: after the 30-day window rolls and base allowance refreshes,
   previously spent credits stay spent.
8. No new path lets a client set its own credit amount, referral status, or another user's
   `bonus_credits`. The reward write happens only inside a `SECURITY DEFINER` DB routine.
9. The gate is green: `npm test && npm run typecheck && npm run lint && npm run build`.

## Tech Stack

Unchanged from the project: Next.js 16 (App Router) + TypeScript · Supabase (Postgres + Auth,
RLS) · OpenRouter · Tailwind v4 + pixel design system · next-intl · Zustand · Vitest + RTL.
No new runtime dependencies anticipated (referral code generated with built-in `crypto`).

## Commands

```
npm run dev         # next dev → http://localhost:3000
npm run build       # production build (also runs tsc)
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm test            # vitest run
npm run test:watch  # vitest (watch)
npm run db:types    # regenerate src/lib/db.types.ts from the linked Supabase project
```

Pre-commit gate (per slice): **`npm test && npm run typecheck && npm run lint && npm run build`**.

## Data Model

### Migration `supabase/migrations/0007_referrals.sql` (append-only, idempotent)

**`profiles` additions**
| Column | Type | Notes |
|---|---|---|
| `referral_code` | `text` unique | App-generated 8-char code, set on first bootstrap when null. |
| `invited_by` | `uuid` null → `auth.users(id)` | The inviter. Set once, never reassigned. |
| `bonus_credits` | `int not null default 0` | Spendable one-time pool. +10 per rewarded referral; −1 per credit-funded generation. Floored at 0. |

**`referrals` table (new)**
| Column | Type | Notes |
|---|---|---|
| `invitee_id` | `uuid` PK → `auth.users(id)` on delete cascade | One row per invitee ⇒ single attribution. |
| `referrer_id` | `uuid not null` → `auth.users(id)` on delete cascade | The inviter. |
| `status` | `text not null default 'pending'` `check in ('pending','rewarded','capped')` | Latch for the reward. |
| `qualified_at` | `timestamptz` null | Set when status leaves `pending`. |
| `created_at` | `timestamptz default now()` | |
| constraint | `referrer_id <> invitee_id` | No self-referral. |
| index | on `referrer_id` | Cap count + listing. |

**RLS on `referrals`**: SELECT where `auth.uid() = referrer_id OR auth.uid() = invitee_id`.
No user INSERT/UPDATE/DELETE policies — rows are created/advanced only by the
`SECURITY DEFINER` routines below. `profiles` RLS is unchanged (owner-only); `bonus_credits`
is raised only by the definer reward routine, and decremented by the owner (self UPDATE).

### Privileged DB routines (the sanctioned RLS exception)

Cross-user writes (crediting the *inviter* from the *invitee's* action) cannot be done by a
route under owner-only RLS, and CLAUDE.md forbids service-role writes from request routes.
Both routines are `SECURITY DEFINER`, schema-qualified, with `SET search_path = ''`, and grant
only fixed, server-defined amounts (no client-supplied values).

1. **`claim_referral(p_code text)`** — called from the auth callback once a session exists.
   Resolves `referrer_id` from `profiles.referral_code = p_code`; if found, `referrer_id <>
   auth.uid()`, the caller has no existing `referrals` row and `invited_by IS NULL`, it inserts
   `referrals(invitee_id = auth.uid(), referrer_id, 'pending')` and sets the caller's
   `invited_by`. Idempotent — safe to call more than once; no-ops after the first.

2. **`award_referral_credit()`** — `AFTER INSERT` trigger on `nodes`. When the inserted node is
   qualifying (`imported = false`, story not `is_demo`), it counts the author's lifetime
   qualifying nodes; if ≥ 10 and the author's referral is still `pending`, it atomically latches
   the referral to `rewarded` (or `capped` when the inviter already has 5 `rewarded`) and, only
   for `rewarded`, increments the inviter's `profiles.bonus_credits` by 10. The latch UPDATE
   (`... where status='pending' returning`) guarantees exactly-once.

> **Decision (locked): reward via the trigger above.** It early-exits on a single PK probe of
> `referrals` (by `invitee_id`) for the ~99% of inserts with no pending referral, so the
> `count(*)` runs only for an invited user's first ≤10 qualifying nodes — served by the existing
> `nodes(created_by, created_at)` index, and dwarfed by the preceding OpenRouter call. The RPC
> alternative does the same count work plus an extra round-trip and is forgettable in one of the
> two routes. Trigger is cheaper end-to-end and exactly-once by construction.

## Domain Logic (pure — `src/domains/quota` & a new `src/domains/referrals`)

- `generation/quota` constants (existing `quota.ts`): keep `SERVER_KEY_BRANCH_LIMIT = 20`.
- New referral constants (pure): `REFERRAL_REWARD_CREDITS = 10`, `REFERRAL_QUALIFY_NODES = 10`,
  `MAX_REWARDED_REFERRALS = 5`, `REFERRAL_CODE_LENGTH = 8`.
- `decideGeneration({ used, baseLimit, bonusCredits })` → `{ allowed: boolean; spendCredit: boolean }`.
  `allowed = used < baseLimit || bonusCredits > 0`; `spendCredit = allowed && used >= baseLimit`.
  Pure; unit-tested.
- `generateReferralCode()` → 8-char base32 from `crypto` random bytes. Pure-ish (random in,
  format asserted in tests).

## Request-path changes (interface layer)

- **`/r/[code]` route** (new, `src/app/r/[code]/route.ts`): sets an httpOnly `referral_code`
  cookie, 302 → `/login`.
- **Auth callback** (`src/app/api/auth/callback/route.ts`): after `exchangeCodeForSession`,
  ensure the profile exists (existing bootstrap), then if a `referral_code` cookie is present
  call `claim_referral(code)` and clear the cookie. Existing redirect unchanged.
- **`bootstrapProfile`**: also assign `referral_code` when null (generate + update self).
- **`POST /api/stories` and `POST /api/stories/[id]/branch`**: replace the bare
  `checkQuota({ used })` with: read `bonus_credits`, compute `decideGeneration(...)`; 429 if not
  allowed; on **successful** generation, if `spendCredit`, atomically decrement one credit
  (`update profiles set bonus_credits = bonus_credits - 1 where id = uid and bonus_credits > 0`).
  Decrement-after-success mirrors the existing "node only persists on success" behavior and
  avoids refund logic.
- New infra: `supabaseCreditCounter`/`consumeCredit` (read + atomic conditional decrement) in
  `src/domains/quota/infrastructure/`, behind a port like the existing counter.

## UI (mobile-first, i18n en + pt-BR)

Minimal for MVP:
- An **Invite** panel/page (`/(app)/invite` or a card on the stories index) showing the
  personal link (`/r/<code>`) with copy-to-clipboard, current `bonus_credits`, and counts of
  invitees / qualified / capped (read from `referrals`).
- A subtle bonus-credit indicator wherever remaining quota is surfaced.
- All copy via next-intl keys added to **both** `messages/en.json` and `messages/pt-BR.json`.
- Reuse pixel chrome (`frame`, `btn`, `chip`, `caption`); verify at ~390px width.

Richer stats/analytics are out of scope.

## Project Structure (new/changed paths)

```
supabase/migrations/0007_referrals.sql            NEW  schema + RLS + claim_referral + trigger
src/domains/referrals/domain/referrals.ts         NEW  constants + generateReferralCode (pure)
src/domains/quota/domain/quota.ts                 EDIT add decideGeneration (pure)
src/domains/quota/infrastructure/credits.ts       NEW  read + atomic decrement of bonus_credits
src/domains/identity/application/bootstrapProfile.ts EDIT assign referral_code when null
src/app/r/[code]/route.ts                         NEW  set cookie + redirect to /login
src/app/api/auth/callback/route.ts                EDIT call claim_referral with cookie code
src/app/api/stories/route.ts                      EDIT credit-aware quota decision
src/app/api/stories/[id]/branch/route.ts          EDIT credit-aware quota decision
src/app/(app)/invite/page.tsx                     NEW  invite link + stats (minimal)
src/components/invite/*                            NEW  invite UI
src/lib/db.types.ts                               EDIT regenerate via npm run db:types
messages/en.json, messages/pt-BR.json             EDIT new copy keys
tests/quota/quota.test.ts                         EDIT decideGeneration cases
tests/referrals/referrals.test.ts                 NEW  generateReferralCode + constants
```

## Testing Strategy

- **Pure unit (Vitest):** `decideGeneration` (below/at/over base, with/without credits, spend
  flag), `generateReferralCode` (length, charset, uniqueness over N draws), constants.
- **Application use cases:** any new service tested via injected fakes (no real DB/network).
- **SQL routines (trigger + `claim_referral`):** *not* unit-tested (CLAUDE.md: no DB in tests).
  Verified manually against the linked Supabase project + in-browser end-to-end. **This is an
  explicit coverage gap to call out in the PR.**
- **UI:** verified in the browser at ~390px, both locales — not asserted in unit tests.

## Boundaries

- **Always:** run the full gate before each commit; keep `domain/` pure; map snake_case ↔
  camelCase in adapters; add i18n keys to both locales; mobile-first verify at ~390px; one door
  per external system (Supabase only in `*/infrastructure` + `lib/supabase`).
- **Ask first:** the trigger-vs-RPC decision above; the migration shape; any new dependency;
  surfacing referral data in any public/unlisted context.
- **Never:** write another user's `profiles` row from a request route; use a service-role client
  in a user-serving route; let a client influence the credit amount / referral status; add an
  UPDATE path to `nodes.content`; log or return the server key.

## Resolved Decisions

1. **Reward wiring:** `SECURITY DEFINER` AFTER INSERT trigger on `nodes` (see Privileged DB
   routines). Confirmed after latency review — early-exit PK probe, count served by existing
   index, all dwarfed by the generation call.
2. **Invitee perk:** inviter-only. The new signup gets the standard 20/window allowance and no
   extra credits.
3. **Invite UI placement:** dedicated `/(app)/invite` page (plus a small bonus-credit indicator
   alongside existing quota surfacing).
4. **Code generation timing:** generated lazily app-side in `bootstrapProfile` when null, with a
   unique constraint backstop.
```
