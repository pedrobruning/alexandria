# Spec: Guided Onboarding Tour

> Feature spec, subordinate to `SPEC.md` (product source of truth) and tracked in `PLAN.md`.
> **Status:** DRAFT — awaiting human review before planning/implementation.
> **Date:** 2026-06-02

## Objective

A first-time, signed-in user lands in Alexandria with no idea that a story is a *tree*. The
core concepts (branching, steering a fork, the Atlas map, the quota, BYOK) only become visible
*inside a story that already has passages* — which a brand-new user does not have. Onboarding
exists to close that gap on the very first sign-in.

**What we build:** a hand-built, pixel-styled **spotlight tour** that runs against a **seeded
read-only demo story**. On first sign-in we auto-create a small pre-branched demo story owned
by the user; the tour spotlights its *real* Atlas, steer box, and fork button with tooltips,
explains quota + BYOK, then ends by sending the user to create their own story. It is
**skippable** at every step and **replayable** from a help (`?`) entry in the header.

**Who:** signed-in testers/founder (Phase 1). Single-player; no conversion funnel.

**Success looks like:** a new user finishes (or skips) the tour understanding that passages
fork into coexisting timelines, that the steer box nudges a fork, and where the Atlas / quota /
BYOK live — without us having spent a single OpenRouter call to teach them.

### Reframed success criteria (testable)

- On first sign-in (`profiles.onboarded_at IS NULL`), a demo story exists for the user and the
  tour auto-starts; the user never sees a blank, unexplained reader.
- The demo story makes **zero** OpenRouter calls and increments **zero** quota — content is
  canned and inserted directly (consistent with "DB is the cache").
- Completing **or** skipping the tour sets `profiles.onboarded_at`; a returning user never sees
  it auto-start again.
- The `?` help entry replays the tour on demand regardless of `onboarded_at`.
- The demo story is read-only: its steer/fork controls are visible (so the tour can point at
  them) but inert, and the branch API rejects writes to a demo story.
- All tour copy and the demo content exist in both `en` and `pt-BR`.

## Tech Stack

No new runtime dependencies. Next.js 16 App Router + TS · Supabase (one migration) ·
Tailwind + pixel CSS · next-intl (`onboarding` namespace) · Zustand (new non-persisted
`onboarding` store for cross-route tour state — justified below) · Vitest + RTL.

**Spotlight is hand-built** (decision): a React overlay using element refs /
`getBoundingClientRect()` + a dimmed backdrop with a cutout and a tooltip card, recomputed on
scroll/resize, styled in the pixel system. No tour library (avoids the pixel-chrome styling
clash and a dependency).

## Commands

Unchanged from `CLAUDE.md`. Gate before committing a slice:

```
npm test && npm run typecheck && npm run lint && npm run build
npm run db:types     # after the migration, to sync src/lib/db.types.ts
```

## Project Structure (new/changed)

```
supabase/migrations/0004_onboarding.sql        profiles.onboarded_at + stories.is_demo
src/lib/db.types.ts                            add the two columns

src/domains/onboarding/
  domain/demoStory.ts                          PURE: canned demo tree (en + pt-BR), no I/O
  domain/tour.ts                               PURE: ordered tour steps + next/prev/skip reducer
src/domains/stories/application/seedDemoStory.ts   use case: build demo tree → StoryWriter port
                                                   (idempotent; { replace } re-seeds for lang switch)
src/domains/identity/application/markOnboarded.ts  set profiles.onboarded_at (idempotent)

src/domains/stories/infrastructure/supabaseStoryWriter.ts   support is_demo + child-node insert
src/domains/stories/infrastructure/supabaseStoryReader.ts   surface is_demo on StoryDetail

src/store/onboarding.ts                        Zustand (non-persisted): tourActive, stepIndex
src/components/onboarding/
  OnboardingTour.tsx                           orchestrates steps, drives cross-route nav
  Spotlight.tsx                                backdrop + cutout + positioned tooltip card
  HelpButton.tsx                               header "?" entry to replay

# anchors added to existing components (data-tour attributes; no behavior change):
src/components/reader/Reader.tsx               data-tour="steer" | "fork", read-only + lang-switch when is_demo
src/components/atlas/AtlasModal.tsx (+ button) data-tour="atlas"
src/components/settings/Byok.tsx (button)      data-tour="settings"

src/app/(app)/stories/page.tsx                 first-sign-in: ensure demo + mount tour; HelpButton
src/app/(app)/stories/[id]/page.tsx            pass is_demo through; HelpButton in header
src/app/api/stories/[id]/branch/route.ts       reject branch on a demo story (boundary guard)

messages/{en,pt-BR}.json                       new "onboarding" namespace (+ demo badge)
tests/onboarding/                              demoStory, tour reducer, seedDemoStory, markOnboarded
```

DDD note: onboarding gets its own `domain/` (pure demo content + tour state machine). Seeding
is a **stories** use case because the stories aggregate owns nodes. Demo content is data, not
next-intl UI copy, so it lives in `domain/demoStory.ts` (en + pt-BR variants), chosen by UI
locale at seed time.

## Code Style

Pure step machine, fully unit-testable, no framework imports:

```ts
// src/domains/onboarding/domain/tour.ts
export type TourStepId = "branching" | "steer" | "atlas" | "quota" | "byok" | "create";

export interface TourStep {
  id: TourStepId;
  anchor: `[data-tour="${string}"]` | null; // null = centered card (intro/outro)
  placement: "top" | "bottom" | "left" | "right" | "center";
}

export const TOUR_STEPS: readonly TourStep[] = [
  { id: "branching", anchor: '[data-tour="atlas"]', placement: "bottom" },
  { id: "steer", anchor: '[data-tour="steer"]', placement: "top" },
  { id: "atlas", anchor: '[data-tour="atlas"]', placement: "bottom" },
  { id: "quota", anchor: '[data-tour="settings"]', placement: "bottom" },
  { id: "byok", anchor: '[data-tour="settings"]', placement: "bottom" },
  { id: "create", anchor: null, placement: "center" },
] as const;

export const nextStep = (i: number) => Math.min(i + 1, TOUR_STEPS.length - 1);
export const prevStep = (i: number) => Math.max(i - 1, 0);
export const isLastStep = (i: number) => i === TOUR_STEPS.length - 1;
```

Conventions per `CLAUDE.md`: camelCase domain / snake_case DB; Tailwind utilities for layout,
pixel component classes for chrome; comments explain WHY only; copy via next-intl.

## Testing Strategy

Vitest + RTL, mirroring source paths under `tests/onboarding/`. Pure logic is the testing
surface; the overlay's pixel positioning is verified in the browser at ~390px, not asserted.

- `demoStory.test.ts` — demo tree is well-formed: one root, ≥1 fork point with ≥2 children
  (so the Atlas badge + branching step have something real to show), both locales present,
  every node has content + summary + title.
- `tour.test.ts` — step order, `next/prev/skip` clamping, `isLastStep`.
- `seedDemoStory.test.ts` — use case persists story (`is_demo=true`) + all demo nodes + sets
  `root_node_id`, via an injected fake writer; **makes no generation call**; nothing persists
  if a write throws.
- `markOnboarded.test.ts` — sets `onboarded_at`; idempotent.
- Guard (extends `tests/cache/frozen.test.tsx`): the seed/demo path never imports the
  generation module at runtime.

## Boundaries

- **Always:** keep `domain/` pure; seed via the `StoryWriter` port (RLS-scoped server client);
  set `onboarded_at` on both complete *and* skip; add copy to both message files; run the
  full gate before commit.
- **Ask first:** any new dependency (we decided **none**); changing the demo's read-only
  semantics; deleting/garbage-collecting demo stories; making the tour a hard gate.
- **Never:** call OpenRouter or touch quota to build the demo; persist/log a BYOK key; add an
  UPDATE path to `nodes.content`; query demo data with a service-role client; let the tour
  block a user who wants to skip straight to creating a story.

## Resolved Decisions (were open questions)

1. **Cross-route tour state → non-persisted Zustand.** `store/onboarding.ts` holds
   `tourActive` + `stepIndex` for the session only (no `persist` — a refresh/return shouldn't
   resume a half-done tour; auto-start is driven by `onboarded_at`, replay by the `?` button).
2. **Demo story → keep + badge.** It stays in the Archive, badged "Demo" (`StoryCard` reads
   `is_demo`). Replay just renavigates to it. No delete/auto-clean UI in scope.
3. **Demo language → seeded in the UI locale, user-changeable.** First sign-in seeds the demo
   in the current UI locale. The demo reader exposes a **switch-language** control that
   **re-seeds** the demo from the other-locale canned tree (delete the demo's nodes + reinsert).
   This is allowed because demo content is canned data, not an AI-generated passage — it does
   **not** violate the `nodes.content` immutability invariant, which guards the economic cache
   of *real* generations only. Implemented as an idempotent `seedDemoStory(..., { replace })`.
4. **"Frozen passages" → omitted as a dedicated step.** Implicitly shown by instant revisits;
   not squeezed into the tour.

## Proposed Plan (Phase → review before TASKS)

1. **Data** — `0004_onboarding.sql` (`profiles.onboarded_at timestamptz`, `stories.is_demo
   boolean not null default false`); push; `npm run db:types`. RLS unchanged (demo rows are
   user-owned like any other).
2. **Pure core** — `demoStory.ts` (canned en+pt-BR tree) + `tour.ts` (step machine), TDD.
3. **Seed + mark** — `seedDemoStory` use case + writer support for `is_demo` and child nodes;
   `markOnboarded`; branch-route demo guard. TDD with fakes.
4. **Overlay** — `Spotlight` + `OnboardingTour` + `onboarding` store; `data-tour` anchors;
   Reader read-only demo mode; `onboarding` message namespace.
5. **Wire-up + replay** — first-sign-in trigger on the archive page (ensure demo, auto-start);
   `HelpButton` in both headers; demo badge on `StoryCard`.
6. **Verify** — browser run at ~390px and desktop: first-sign-in → tour → create; skip mid-tour
   sets the flag; returning user no auto-start; replay works; network panel shows zero
   generation for the demo. Update `PLAN.md`.

## Tasks (ordered by dependency)

- [ ] **O1 · Data layer** — migration + types.
  - Acceptance: `0004_onboarding.sql` adds `profiles.onboarded_at timestamptz` and
    `stories.is_demo boolean not null default false`; RLS unchanged (demo rows are user-owned);
    `src/lib/db.types.ts` reflects both columns.
  - Verify: `supabase db push` succeeds; `npm run db:types` then `npm run typecheck` green.
  - Files: `supabase/migrations/0004_onboarding.sql`, `src/lib/db.types.ts`.
  - Deps: none. Scope: S.

- [ ] **O2 · Pure core (TDD)** — demo content + tour step machine.
  - Acceptance: `demoStory.ts` exports a canned tree (en + pt-BR) with one root, ≥1 fork point
    with ≥2 children, every node having title+content+summary; `tour.ts` exports `TOUR_STEPS`
    and `next/prev/skip/isLastStep`.
  - Verify: `tests/onboarding/{demoStory,tour}.test.ts` green; no I/O imports in `domain/`.
  - Files: `src/domains/onboarding/domain/{demoStory,tour}.ts`, the two test files.
  - Deps: none. Scope: M.

- [ ] **O3 · Seed + mark + guard (TDD)** — use cases and the demo write-block.
  - Acceptance: `seedDemoStory(writer, { userId, locale, replace? })` persists a story
    (`is_demo=true`) + all demo nodes + sets `root_node_id`, makes **no** generation call, and
    rolls back nothing-persisted on a write throw; `{ replace: true }` re-seeds (delete demo
    nodes, reinsert) for the language switch; `markOnboarded` sets `onboarded_at` idempotently;
    `POST /api/stories/[id]/branch` returns a clear error if the target story `is_demo`.
  - Verify: `tests/onboarding/{seedDemoStory,markOnboarded}.test.ts` green (injected fakes);
    extend `tests/cache/frozen.test.tsx` so the seed path can't import generation at runtime.
  - Files: `src/domains/stories/application/seedDemoStory.ts`,
    `src/domains/identity/application/markOnboarded.ts`,
    `src/domains/stories/infrastructure/supabaseStoryWriter.ts` (is_demo + child/delete),
    `src/app/api/stories/[id]/branch/route.ts` (guard), tests.
  - Deps: O1, O2. Scope: M.

- [ ] **O4 · Spotlight overlay + store** — the hand-built tour UI.
  - Acceptance: `Spotlight` dims the screen, cuts out the anchor element's rect (via
    `getBoundingClientRect`), and positions a pixel tooltip card per `placement`; recomputes on
    scroll/resize and scrolls the anchor into view; `OnboardingTour` reads `TOUR_STEPS` + the
    non-persisted `store/onboarding.ts` (`tourActive`, `stepIndex`); Skip on every step;
    `onboarding` message namespace added to both locales.
  - Verify: browser at ~390px and desktop — backdrop + cutout track the right elements, no
    horizontal overflow; `npm run lint && npm run build` green. (Positioning is browser-verified,
    not unit-asserted.)
  - Files: `src/components/onboarding/{OnboardingTour,Spotlight}.tsx`, `src/store/onboarding.ts`,
    `messages/{en,pt-BR}.json`.
  - Deps: O2. Scope: M.

- [ ] **O5 · Anchors + demo reader mode** — wire targets and read-only/lang-switch.
  - Acceptance: `data-tour` anchors on the steer box, fork button, Atlas opener, and settings
    button; when `story.is_demo`, the Reader shows steer/fork as visible-but-inert and exposes a
    switch-language control that calls the re-seed path; `StoryCard` shows a "Demo" badge.
  - Verify: browser — demo reader is non-writable, language switch swaps the canned content;
    real stories are unaffected; `npm test && npm run build` green.
  - Files: `src/components/reader/Reader.tsx`, `src/components/atlas/AtlasModal.tsx`,
    `src/components/settings/Byok.tsx`, `src/components/stories/StoryCard.tsx`.
  - Deps: O3, O4. Scope: M.

- [ ] **O6 · First-sign-in trigger + replay + verify** — assemble and prove it.
  - Acceptance: on the archive page, a user with `onboarded_at IS NULL` gets a demo ensured
    (seed if missing) and the tour auto-starts; completing or skipping calls `markOnboarded`; a
    `?` `HelpButton` in both headers replays the tour regardless of `onboarded_at`; returning
    users never auto-start.
  - Verify: browser end-to-end — first sign-in → tour over the demo → "create your own";
    mid-tour skip sets the flag; reload as a returning user → no auto-start; `?` replays;
    network panel shows zero generation for the demo. Update `PLAN.md` (new task cards + log).
  - Files: `src/app/(app)/stories/page.tsx`, `src/app/(app)/stories/[id]/page.tsx`,
    `src/components/onboarding/HelpButton.tsx`, `PLAN.md`.
  - Deps: O5. Scope: M.

## Verification Checklist (spec-driven gate)

- [x] Covers all six core areas (objective, commands, structure, style, testing, boundaries)
- [x] Success criteria are specific and testable
- [x] Boundaries (Always / Ask first / Never) defined
- [x] Saved to a file in the repo (`SPEC.onboarding.md`)
- [x] Open questions resolved (non-persisted store · keep+badge · changeable demo language · omit frozen)
- [ ] **Human reviews the O1–O6 task breakdown → then Phase 4 implement (TDD, slice by slice)**
