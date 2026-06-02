# Implementation Plan: Alexandria — Branches (Phase 1 MVP)

> Derived from `SPEC.md`.
> **Status:** In progress — Phase 2 (Core Loop). Foundation (T1–T4) + Auth (T5) complete; Create (T6) landed, pending end-to-end browser verify. Added scope: pixel design system, per-story generation language, and UI i18n.
> **Last updated:** 2026-06-02

## Progress Log

| Date | Commit | What landed |
|------|--------|-------------|
| — | `99da87f` | Supabase browser/server client factories (T2) |
| — | `6adf4b6` | DB schema, RLS policies, typed `Database` (T3) |
| — | `dd5b1cc` | Provider-agnostic generation domain (T4) |
| — | `fae11f0` | Magic-link auth, profile bootstrap, session proxy (T5) |
| — | `182e868` | Forklore→Alexandria pixel design system + shared components (Added scope A) |
| 2026-06-02 | `e010f68` | Story-creation domain + `POST /api/stories` (T6 backend) |
| 2026-06-02 | `71a08c5` | Archive (stories list) screen (T6) |
| 2026-06-02 | `a903f34` | Create screen + per-story generation language en/pt-BR (T6 + Added scope B) |
| 2026-06-02 | `b4299f0` | UI translations en + pt-BR via next-intl (Added scope C) |

> **DDD note:** the generation layer lives under `src/domains/generation/{domain,application,infrastructure}` (and a new `src/domains/stories/…`), not the flat `src/lib/generation/*` the original task cards named. Domains-by-feature, ports/adapters.

## Overview

Build the single-player branching MVP: a signed-in user creates a story, reads ~250-word
passages, forks any passage (optionally steered) into coexisting timelines, and revisits
frozen passages with zero generation cost. Next.js App Router + Supabase + OpenRouter.

## Locked Decisions (from SPEC open questions)

1. **Auth:** magic link (no passwords).
2. **Summary:** model returns passage + one-line summary in a single structured response. (Also returns a 2–4 word chapter **title** — used by the story title and node labels.)
3. **Default model:** configurable via `OPENROUTER_DEFAULT_MODEL` env. Locked: `openai/gpt-5.4-nano`.
4. **Quota:** 20 server-key branches per user per rolling 30-day window; BYOK bypasses it.
5. **Steer:** free-text box in the reader panel.
6. **Generation language:** per-story, chosen at creation (English / Brazilian Portuguese). Persisted on `stories.language`; branches inherit it.
7. **UI locale:** independent of generation language. next-intl, cookie-based (no URL routing), English default with first-render Accept-Language detection. en + pt-BR.
8. **Brand:** displayed name is **Alexandria** (repo/package stays `alexandria`; the design bundle's "Forklore" wording was reskinned).

## Architecture Decisions

- **Server-only secrets.** All OpenRouter calls + quota checks live in Route Handlers. No
  key (server or BYOK) ever reaches a client bundle or a log line.
- **DB is the cache.** `nodes.content` is immutable — no UPDATE/regenerate path. Revisiting
  a node is a pure SELECT. This is the core economic guarantee, so it gets its own
  verification task (Task 11).
- **Adjacency-list tree.** `nodes.parent_id`; tree layout computed client-side with
  `d3-hierarchy`, rendered as our own SVG (no graph lib).
- **Generation layer is provider-abstracted** behind one module, so BYOK/model-choice and a
  future provider swap are config, not a rewrite.
- **Vertical slices.** After a thin shared foundation, each task delivers a working,
  testable path rather than a horizontal layer.

## Dependency Graph

```
Scaffold (T1) ── Supabase wiring (T2) ── Schema + RLS (T3)
                                              │
                        Generation lib (T4) ──┤
                                              │
                            Auth / magic link (T5)
                                              │
                 ┌────────────────────────────┼───────────────┐
        Create story + root (T6)      Reader view (T7)         │
                 │                            │                │
        Branch + steer + quota (T8) ──────────┘                │
                 │                                             │
        Atlas render (T9) ── Atlas interaction (T10)           │
                 │                                             │
        Frozen-cache verify (T11)                              │
        BYOK + model picker (T12) ─────────────────────────────┘
```

---

## Task List

### Phase 1: Foundation

## Task 1: Scaffold Next.js app + tooling ✅
**Description:** Initialize Next.js (App Router, TS) with Tailwind, ESLint, Vitest + RTL,
and the npm scripts from SPEC. Establish `src/` layout.
**Acceptance criteria:**
- [x] `npm run dev` serves a placeholder home at :3000
- [x] `npm run typecheck`, `npm run lint`, `npm test` all run (empty/passing) green
**Verification:**
- [x] Build succeeds: `npm run build`
- [x] A trivial vitest test passes
**Dependencies:** None
**Files:** `package.json`, `next.config.*`, `tsconfig.json`, `tailwind.config.*`, `vitest.config.*`, `src/app/{layout,page}.tsx`
**Scope:** M

## Task 2: Supabase client wiring ✅
**Description:** Add `@supabase/supabase-js` + `@supabase/ssr`; create browser + server
client factories and env scaffolding (`.env.example`). No tables yet.
**Acceptance criteria:**
- [x] `lib/supabase/{client,server}.ts` export typed factories
- [x] Server client reads/writes the auth cookie in an App Router context
**Verification:**
- [x] A server component can call `supabase.auth.getUser()` without crashing (null user OK)
- [x] `npm run typecheck` passes
**Note:** publishable key env is `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Session refresh
lives in `src/lib/supabase/middleware.ts`, invoked from `src/proxy.ts` (Next 16 `proxy`).
**Dependencies:** T1
**Files:** `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `.env.example`
**Scope:** S

## Task 3: Database schema, RLS, generated types ✅
**Description:** Migrations for `profiles`, `stories`, `nodes` (per SPEC data model) with RLS
restricting all rows to the owning user; generate TS types.
**Acceptance criteria:**
- [x] Migrations create all three tables with FKs and `on delete cascade` on `nodes`
- [x] RLS policies: a user can only select/insert their own rows
- [x] `src/lib/db.types.ts` (hand-authored typed `Database`; kept in sync by hand)
**Verification:**
- [x] Migrations pushed to remote Supabase (`supabase db push`, confirmed 2026-06-02)
- [ ] Manual: a second user cannot read the first user's stories (cross-user read test pending)
**Migrations:** `0001_init.sql`, `0002_node_title_and_usage.sql` (node `title` + usage
counting), `0003_story_language.sql` (`stories.language` default `'en'`).
**Dependencies:** T2
**Files:** `supabase/migrations/0001_init.sql`, `src/lib/db.types.ts`
**Scope:** M

## Task 4: OpenRouter generation library ✅
**Description:** Provider-abstracted generation module: OpenRouter client, system prompt,
prompt builder, ancestor-chain assembly, and parsing of the structured passage+summary
response. Mockable for tests. (Decide `OPENROUTER_DEFAULT_MODEL` here.)
**Acceptance criteria:**
- [x] `generate({ story, ancestors, steer, apiKey?, model? }) → { content, summary, title }`
- [x] Ancestor chain assembly (unit tested)
- [x] Accepts an injected key/model (enables BYOK + tests); never logs the key
**Verification:**
- [x] Unit tests (mocked HTTP) cover prompt build, ancestor assembly, response parse
- [x] `npm test` green
**Dependencies:** T1 (logic only; no DB needed)
**Files:** `src/domains/generation/{domain,application,infrastructure}/*`, `tests/generation/*`
(see DDD note — not the flat `src/lib/generation/*` named above)
**Scope:** M
**Extended:** response now also returns a 2–4 word `title`; prompt builder appends a
generation-language instruction (`src/domains/generation/domain/language.ts`).

### Checkpoint: Foundation (after T1–T4) ✅
- [x] `npm run typecheck && npm run lint && npm test && npm run build` all pass
- [x] Schema pushed to remote; generation lib unit-tested (cross-user RLS test still pending)
- [x] **Review with human before Phase 2**

---

### Phase 2: Core Loop

## Task 5: Auth (magic link) + profile bootstrap ✅
**Description:** Login page (email → magic link), callback handling, session via `@supabase/ssr`,
auto-create a `profiles` row on first sign-in, and protect `(app)/*` routes.
**Acceptance criteria:**
- [x] Unauthenticated user hitting `/stories` is redirected to `/login`
- [x] After magic-link sign-in, a `profiles` row exists and `/stories` renders
**Verification:**
- [x] Manual: full sign-in round-trip works locally
- [x] `npm run typecheck` passes
**Dependencies:** T3
**Files:** `src/app/(auth)/login/page.tsx`, `src/app/api/auth/callback/route.ts`, middleware/guard, profile bootstrap
**Scope:** M

## Task 6: Create story + root passage 🚧 (mostly done)
**Description:** Story list page with a create form (premise/genre/tone); `POST /api/stories`
generates the root passage via T4, inserts `stories` + root `nodes`, sets `root_node_id`.
**Acceptance criteria:**
- [x] Submitting the form creates a story and a root node with AI content + summary
- [x] Story list (Archive) shows the user's stories; "New story" routes to `/stories/new`
- [ ] Opening a story routes to `/stories/[id]` (reader route lands in T7 — redirect 404s until then)
**Verification:**
- [x] Unit: `createStory` use-case test (persists story + root node, sets `root_node_id`;
  nothing persists if generation throws) — `tests/stories/createStory.test.ts`
- [ ] Manual end-to-end: create a story in the browser, see the root passage, refresh — persists
- [ ] Quota counter increments for server-key generation (lands with T8)
**Dependencies:** T4, T5
**Files:** `src/app/(app)/stories/{page,new/page}.tsx`, `src/app/api/stories/route.ts`,
`src/components/stories/{CreateStoryForm,StoryCard}.tsx`, `src/domains/stories/*`
**Scope:** M

## Task 7: Reader view
**Description:** Reader panel for a selected node: full passage text, breadcrumb of the path
from root, and the list of existing child branches.
**Acceptance criteria:**
- [ ] Selecting a node shows its content, an accurate root→node breadcrumb, and its children
- [ ] Clicking a breadcrumb/child node changes the selection
**Verification:**
- [ ] Unit: breadcrumb/path derivation from adjacency list
- [ ] Manual: navigation between nodes updates the reader correctly
**Dependencies:** T6
**Files:** `src/components/reader/*`, `src/lib/tree/path.ts`, `tests/tree/path.test.ts`
**Scope:** M

## Task 8: Branch generation with steering + quota
**Description:** Steer free-text box + "Fork from here"; `POST /api/stories/[id]/branch`
checks quota server-side, assembles ancestor chain, generates, inserts a child node.
**Acceptance criteria:**
- [ ] Forking (with or without steer) inserts a child; multiple branches coexist off one node
- [ ] Server-key generation past quota is rejected with a clear message (BYOK exempt)
**Verification:**
- [ ] Unit: quota check logic
- [ ] Manual: create two steered branches off one node; both appear
**Dependencies:** T7
**Files:** `src/app/api/stories/[id]/branch/route.ts`, steer component, `src/lib/quota.ts`, `tests/quota.test.ts`
**Scope:** M

### Added Scope (not in the original task cards)

These shipped alongside Phase 1/2 and are complete:

**A. Pixel design system** — `182e868`. Reskinned the "Forklore" design bundle into
Alexandria's "pixel chrome, smooth body" system: CSS primitives in `globals.css` (frame,
btn, chip, field, label, tag, seal, headings, layout helpers, `bg-dune`/`vignette`/`fret`)
and shared pixel components (`PixelIcon`, `Wordmark`, `PixSpinner`, `Toast`). Design source
in `design/project/src/screens.jsx`.

**B. Per-story generation language** — `a903f34`. Story content language chosen at creation
(English / Brazilian Portuguese), persisted on `stories.language`, threaded end-to-end:
`language.ts` (codes/labels/prompt names) → `buildPrompt` instruction → `createStory` →
`supabaseStoryWriter` insert → `POST /api/stories` validation → `0003_story_language.sql`.
Branches inherit the story's language.

**C. UI/site i18n** — `b4299f0`. next-intl 4.13, cookie-based (no URL routing), English
default with first-render Accept-Language detection. Locale config in `src/i18n/{locales,
request}.ts`, `messages/{en,pt-BR}.json`, `NextIntlClientProvider` in the root layout, and a
`LocaleSwitcher` chip group. Independent of generation language.

### Checkpoint: Core Loop (after T5–T8)
- [ ] End-to-end: sign in → create story → read → steer-fork → branch appears, persists
- [ ] All tests + typecheck + lint + build pass
- [ ] **Review with human before Phase 3**

---

### Phase 3: Atlas, Cache Guarantee, BYOK

## Task 9: Story Atlas — static render
**Description:** Compute tidy-tree layout (`d3-hierarchy`) and render SVG nodes/edges,
highlight the current timeline path, and badge fork points with branch counts.
**Acceptance criteria:**
- [ ] Tree renders with correct parent→child edges and current-path highlight
- [ ] Fork nodes show a badge with their child count
**Verification:**
- [ ] Unit: layout + path-highlight derivation
- [ ] Manual: a multi-branch story renders a sensible tree
**Dependencies:** T8
**Files:** `src/components/atlas/*`, `src/lib/tree/layout.ts`, `tests/tree/layout.test.ts`
**Scope:** M

## Task 10: Story Atlas — interaction
**Description:** Pan/scroll, click a node to select + auto-center, sync selection with the
reader via the Zustand store.
**Acceptance criteria:**
- [ ] Clicking an Atlas node selects it, recenters, and updates the reader
- [ ] Pan/scroll works without losing selection
**Verification:**
- [ ] Manual: navigate a 10+ node tree by clicking around the Atlas
**Dependencies:** T9
**Files:** `src/components/atlas/*`, `src/store/atlas.ts`
**Scope:** M

## Task 11: Frozen-cache verification
**Description:** Prove (and guard) that revisiting any existing node makes zero generation
calls — pure SELECT path. Add a regression test/guard around the read path.
**Acceptance criteria:**
- [ ] Revisiting a node issues no request to the branch/generation endpoints
- [ ] A test fails if a read path ever invokes the generation module
**Verification:**
- [ ] Manual: network panel + server logs show zero generation on revisit
- [ ] Automated guard test passes
**Dependencies:** T10
**Files:** `tests/cache/frozen.test.ts`, minor read-path guard
**Scope:** S

## Task 12: BYOK + model picker
**Description:** Settings to enter an OpenRouter key (stored in localStorage) and pick a
model; branch/root requests pass the key through transiently; BYOK bypasses quota; never
persisted/logged server-side.
**Acceptance criteria:**
- [ ] With a BYOK key set, generation uses it + the chosen model and bypasses quota
- [ ] Key never appears in DB, server logs, or any response body
**Verification:**
- [ ] Manual: set BYOK, generate past the would-be quota, confirm success
- [ ] Grep server logs for the key → absent
**Dependencies:** T8 (and T4)
**Files:** `src/components/settings/byok.tsx`, generation route updates, `src/store/atlas.ts` (or settings store)
**Scope:** M

### Checkpoint: Complete (after T9–T12)
- [ ] All 7 SPEC success criteria met
- [ ] `npm run typecheck && npm run lint && npm test && npm run build` pass; `lib/` ≥ 80%
- [ ] Manual golden-path + edge cases verified; **ready for review**

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Atlas layout/interaction is the trickiest UI | Med | Split into T9 (render) / T10 (interaction); fail fast in Phase 3 |
| Structured passage+summary parsing flaky across models | Med | Strict parse + defensive fallback (derive summary from content); pin default model |
| BYOK key leakage (log/persist) | High | Server-only pass-through, never store; explicit grep check in T12 verification |
| Quota race (parallel forks exceed cap) | Low | Server-side count immediately before insert; acceptable slack for MVP |
| RLS misconfig exposes other users' stories | High | Cross-user read test in T3 verification |

## Open Questions
- _(resolved)_ `OPENROUTER_DEFAULT_MODEL` → `openai/gpt-5.4-nano` (Locked Decision 3).
- _(resolved)_ Quota window → 20 server-key branches per rolling 30-day window (Locked Decision 4).
- Handle capture / onboarding for `profiles` (Archive currently falls back to the email prefix).
```
