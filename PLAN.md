# Implementation Plan: Alexandria — Branches (Phase 1 MVP)

> Derived from `SPEC.md`. Read-only planning artifact — no code until approved.
> **Status:** Draft — awaiting review before implementation.

## Overview

Build the single-player branching MVP: a signed-in user creates a story, reads ~250-word
passages, forks any passage (optionally steered) into coexisting timelines, and revisits
frozen passages with zero generation cost. Next.js App Router + Supabase + OpenRouter.

## Locked Decisions (from SPEC open questions)

1. **Auth:** magic link (no passwords).
2. **Summary:** model returns passage + one-line summary in a single structured response.
3. **Default model:** configurable via `OPENROUTER_DEFAULT_MODEL` env (pick before Task 4).
4. **Quota:** 20 server-key branches per user per rolling window; BYOK bypasses it.
5. **Steer:** free-text box in the reader panel.

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

## Task 1: Scaffold Next.js app + tooling
**Description:** Initialize Next.js (App Router, TS) with Tailwind, ESLint, Vitest + RTL,
and the npm scripts from SPEC. Establish `src/` layout.
**Acceptance criteria:**
- [ ] `npm run dev` serves a placeholder home at :3000
- [ ] `npm run typecheck`, `npm run lint`, `npm test` all run (empty/passing) green
**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] A trivial vitest test passes
**Dependencies:** None
**Files:** `package.json`, `next.config.*`, `tsconfig.json`, `tailwind.config.*`, `vitest.config.*`, `src/app/{layout,page}.tsx`
**Scope:** M

## Task 2: Supabase client wiring
**Description:** Add `@supabase/supabase-js` + `@supabase/ssr`; create browser + server
client factories and env scaffolding (`.env.example`). No tables yet.
**Acceptance criteria:**
- [ ] `lib/supabase/{client,server}.ts` export typed factories
- [ ] Server client reads/writes the auth cookie in an App Router context
**Verification:**
- [ ] A server component can call `supabase.auth.getUser()` without crashing (null user OK)
- [ ] `npm run typecheck` passes
**Dependencies:** T1
**Files:** `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `.env.example`
**Scope:** S

## Task 3: Database schema, RLS, generated types
**Description:** Migrations for `profiles`, `stories`, `nodes` (per SPEC data model) with RLS
restricting all rows to the owning user; generate TS types.
**Acceptance criteria:**
- [ ] Migrations create all three tables with FKs and `on delete cascade` on `nodes`
- [ ] RLS policies: a user can only select/insert their own rows
- [ ] `npm run db:types` produces `src/lib/db.types.ts`
**Verification:**
- [ ] Applying migrations on a fresh DB succeeds
- [ ] Manual: a second user cannot read the first user's stories
**Dependencies:** T2
**Files:** `supabase/migrations/0001_init.sql`, `src/lib/db.types.ts`
**Scope:** M

## Task 4: OpenRouter generation library
**Description:** Provider-abstracted generation module: OpenRouter client, system prompt,
prompt builder, ancestor-chain assembly, and parsing of the structured passage+summary
response. Mockable for tests. (Decide `OPENROUTER_DEFAULT_MODEL` here.)
**Acceptance criteria:**
- [ ] `generate({ story, ancestors, steer, apiKey?, model? }) → { content, summary }`
- [ ] Ancestor chain = `[root.summary … parent.summary, parent.content]` (unit tested)
- [ ] Accepts an injected key/model (enables BYOK + tests); never logs the key
**Verification:**
- [ ] Unit tests (mocked HTTP) cover prompt build, ancestor assembly, response parse
- [ ] `npm test` green; `lib/generation` ≥ 80% covered
**Dependencies:** T1 (logic only; no DB needed)
**Files:** `src/lib/generation/{index,buildPrompt,ancestors,parse}.ts`, `tests/generation/*`
**Scope:** M

### Checkpoint: Foundation (after T1–T4)
- [ ] `npm run typecheck && npm run lint && npm test && npm run build` all pass
- [ ] Schema + RLS verified on a fresh DB; generation lib unit-tested
- [ ] **Review with human before Phase 2**

---

### Phase 2: Core Loop

## Task 5: Auth (magic link) + profile bootstrap
**Description:** Login page (email → magic link), callback handling, session via `@supabase/ssr`,
auto-create a `profiles` row on first sign-in, and protect `(app)/*` routes.
**Acceptance criteria:**
- [ ] Unauthenticated user hitting `/stories` is redirected to `/login`
- [ ] After magic-link sign-in, a `profiles` row exists and `/stories` renders
**Verification:**
- [ ] Manual: full sign-in round-trip works locally
- [ ] `npm run typecheck` passes
**Dependencies:** T3
**Files:** `src/app/(auth)/login/page.tsx`, `src/app/api/auth/callback/route.ts`, middleware/guard, profile bootstrap
**Scope:** M

## Task 6: Create story + root passage
**Description:** Story list page with a create form (premise/genre/tone); `POST /api/stories`
generates the root passage via T4, inserts `stories` + root `nodes`, sets `root_node_id`.
**Acceptance criteria:**
- [ ] Submitting the form creates a story and a root node with AI content + summary
- [ ] Story list shows the user's stories; opening one routes to `/stories/[id]`
**Verification:**
- [ ] Manual: create a story, see the root passage; refresh — it persists
- [ ] Quota counter increments for server-key generation
**Dependencies:** T4, T5
**Files:** `src/app/(app)/stories/page.tsx`, `src/app/api/stories/route.ts`, create-form component
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
- `OPENROUTER_DEFAULT_MODEL` value — decide before Task 4 (cost vs. fiction quality).
- Quota window length (per-day vs. lifetime) — default to per-rolling-30-day unless you prefer per-day.
```
