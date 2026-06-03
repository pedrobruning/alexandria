# CLAUDE.md

Guidance for working in this repo. Read this first; `SPEC.md` is the source of truth for
*what* we're building and `PLAN.md` tracks *where we are*. When this file and the code
disagree, trust the code and fix this file.

## Project

**Alexandria** is a single-player branching AI-fiction app: a story is a *tree*, not a line.
A signed-in user writes a premise, reads ~250-word passages, and forks any passage into
coexisting timelines (optionally *steering* a branch). Passages are **frozen once written** —
revisiting a node is a pure DB read with **zero** generation calls. This "DB is the cache"
property is the core economic guarantee, not an optimization.

Phase 1 MVP, founder + a few testers. Social/sharing/discovery are out of scope.

**Stack:** Next.js 16 (App Router) + TypeScript · Supabase (Postgres + Auth, RLS) ·
OpenRouter (model-agnostic generation) · Tailwind + a custom pixel design system ·
next-intl (UI i18n) · Zustand (client selection state, arriving with the Atlas) · Vitest + RTL.

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

Before committing a slice, the gate is: **`npm test && npm run typecheck && npm run lint && npm run build`** all green.

## Architecture — Domain-Driven Design

Organized **by domain, not by technical layer**. Each domain separates pure logic from I/O
from orchestration. Routes and components are a thin **interface** layer that calls into
application services. Be pragmatic — add a layer only when it earns its place.

```
src/
  domains/
    generation/        provider-agnostic prose generation
      domain/            buildPrompt, ancestors, parse, language, types  (PURE — no I/O, no framework)
      application/       generatePassage  (orchestrates build → call → parse)
      infrastructure/    openrouter  (the ONLY place the OpenRouter HTTP client lives)
    stories/           the story aggregate: a tree of immutable passages
      domain/            types (StorySummary, StoryNode, StoryDetail)
      application/       createStory  (use cases; depend on ports, not Supabase)
      infrastructure/    supabaseStoryReader / supabaseStoryWriter  (the ONLY place Supabase is touched)
    identity/          application/bootstrapProfile
  app/                 INTERFACE (thin): routes/pages call application services
    (auth)/login, (app)/stories, (app)/stories/[id], api/stories[/[id]/branch], api/auth/callback
  components/          INTERFACE (UI), grouped by feature: reader/, stories/, pixel/, i18n/, auth/, atlas/(later)
  lib/                 cross-cutting infra, NOT a domain: supabase/{client,server}, db.types, tree/path
  store/               Zustand client selection state (arrives with the Atlas, T10)
  i18n/                next-intl config; messages live in /messages/{en,pt-BR}.json
supabase/migrations/   SQL: profiles, stories, nodes + RLS
tests/                 vitest, mirrors src/domains + src/lib paths
```

### DDD rules (non-negotiable)

- **`domain/` is pure.** No imports of Supabase, OpenRouter, `next/*`, or any I/O. These are
  the most heavily unit-tested files.
- **Ports & adapters.** Application services depend on an interface defined next to them (e.g.
  `StoryWriter` in `createStory.ts`), and the Supabase adapter implements it in
  `infrastructure/`. Tests inject a fake; production injects the real adapter at the route.
- **One door per external system.** Supabase is imported only in `*/infrastructure/supabase*`
  and `lib/supabase/*`. OpenRouter only in `generation/infrastructure/openrouter.ts`.
- **camelCase domain, snake_case DB.** Adapters map between them (e.g. `parent_id` → `parentId`).
- **The `stories` aggregate owns `nodes`.** Other code touches nodes only through its services.
- Note: code uses `domains/stories` (plural); `SPEC.md` sketches it as `story`. Follow the code.

## TDD workflow

This repo is built test-first, slice by slice (incremental-implementation).

1. **RED** — write a failing test for the next behavior. Put pure-logic tests under `tests/`,
   mirroring the source path (`src/lib/tree/path.ts` → `tests/tree/path.test.ts`).
2. **GREEN** — write the minimum code to pass.
3. Run the **full** suite + typecheck to catch regressions.
4. Run the **build**.
5. **Commit** the slice with a descriptive message.

What gets a unit test: every `domain/` function and `application/` use case (via injected
fakes — never hit a real DB or network in tests). UI is verified in the browser, not asserted
in unit tests, unless there's pure derivation worth isolating.

## Clean code conventions

- **Smallest thing that works.** No abstractions for hypothetical futures; no error handling
  for cases that can't happen. Validate only at boundaries (route input, external responses).
- **Comments explain WHY, not WHAT.** Default to none. A comment earns its place only for a
  non-obvious constraint, invariant, or surprise. Don't reference tasks/PRs/callers in code.
- **Scope discipline.** Touch only what the task needs. No drive-by refactors or "cleanup."
- **Names carry meaning** so the code reads without commentary.

## Security invariants (treat as load-bearing)

- **Server-only secrets.** All OpenRouter calls + quota checks live in Route Handlers. The
  server key must never reach a client bundle, a response body, or a log line.
- **RLS scopes every row to its owner.** Reads/writes use the request-bound server client, so
  RLS is the real authorization boundary — never query with a service-role client from a route
  that serves user data.
- **Passages are immutable.** `nodes.content` has no UPDATE/regenerate path; revisiting is a
  pure SELECT. Don't add a write path that breaks this.

## Locked decisions (see SPEC/PLAN for the full list)

- Auth: magic link, no passwords.
- Default model: `OPENROUTER_DEFAULT_MODEL`, locked to `openai/gpt-5.4-nano`.
- Quota: 20 generations per user per rolling 30-day window (free allowance; demo excluded).
  A paid "buy credits" model is planned to extend this — see `SPEC.md` *Future direction* for
  the direction. BYOK was removed.
- Generation language: per-story, chosen at creation (en / pt-BR), persisted on
  `stories.language`; branches inherit it. **Independent** of the UI locale.
- UI i18n: next-intl, cookie-based (no URL routing), en default with Accept-Language detection.

## Styling & i18n

- **Mobile-first.** Design and build for a phone viewport (~360–390px) first, then let
  layouts widen for tablet/desktop. Every screen must work with no horizontal overflow on a
  phone: prefer fluid widths (`width: 100%`, `min(…, 100%)`) over fixed/`vw` widths, let
  header and toolbar clusters `wrap`, hide non-essential chrome on small screens (`.hide-sm`),
  and keep tap targets comfortable. The mobile tuning lives in the `max-width: 640px` block of
  `globals.css` plus the `.app-header__bar` / `.app-content` / `.app-main` shell classes —
  extend those rather than scattering ad-hoc media queries. Verify new UI at ~390px width.
- **Tailwind v4 + a pixel design system.** Tailwind is active via `@import "tailwindcss"` in
  `globals.css`. Design tokens (palette + fonts) are registered in the `@theme` block, so they
  exist both as utilities (`bg-basalt`, `text-sand-light`, `border-gold`, `font-body`) and as
  `var(--color-*)` / short `var(--basalt)` aliases. **Prefer Tailwind utilities for layout,
  spacing, sizing, and responsive (`sm:`/`md:`)** instead of inline `style={{…}}`.
- The pixel "chrome" stays hand-authored CSS: component classes (`frame`, `btn`, `chip`, `tag`,
  `prose`, `h1/h2`, `node-title`, `caption`, `field`, `label`) and all keyframe animations live
  in `globals.css` — their multi-layer bevel shadows and animations don't belong in utility
  soup. Reuse these classes; compose utilities around them. Design source:
  `design/project/src/screens.jsx`.
- All user-facing copy goes through next-intl. Add keys to **both** `messages/en.json` and
  `messages/pt-BR.json`; read them with `useTranslations` (client) or `getTranslations` (server).
