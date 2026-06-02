# Spec: Alexandria — Branches (Phase 1 MVP)

> Living document. Source of truth for the build. Derived from `PRD.md`; where they
> conflict, the decisions recorded here win (and the PRD should be updated to match).
> **Status:** Draft — awaiting review before Plan phase.

## Objective

Build the **single-player MVP** of Alexandria: a branching AI-fiction app where a story
is a *tree*, not a line. A user creates a story from a premise, reads ~250-word passages,
and forks any passage into alternate timelines — optionally *steering* each branch
("but she refuses the offer"). Written passages are **frozen**: revisiting any node is
instant and triggers **zero** generation calls (the DB *is* the cache).

**Leading fantasy (PRD §4 decision):** *Explorer-first with light authoring.* "I drop
into a story and fork it myself." Mass-market play, lighter UX. The social layer, shared
links, and discovery are explicitly **out of scope** for this phase.

**Who it's for:** the founder + a handful of testers. The goal of this phase is to prove
the core loop (create → read → steer-fork → revisit) is *fun and retentive*, per PRD §14
Phase 1. It is not yet a public product.

**What success looks like:** see Success Criteria below — the core loop works end to end,
state survives refresh, branching is genuinely engaging to use, and cost is bounded.

## Tech Stack

- **Framework:** Next.js (App Router) + TypeScript. React Server Components where they help;
  generation and all secret-touching logic in **Route Handlers** (server-only).
- **Styling:** Tailwind CSS over a custom pixel design system. **Mobile-first:** every screen
  is designed for a phone viewport first (~360–390px) and progressively enhanced for larger
  screens; no screen may overflow horizontally on a phone.
- **Tree rendering:** SVG nodes/edges with a tidy-tree layout (`d3-hierarchy` for layout
  math; we render the SVG ourselves — no heavyweight graph lib).
- **Data + Auth:** Supabase (Postgres + Auth). Client uses `@supabase/supabase-js`;
  server uses `@supabase/ssr` for cookie-based sessions in App Router.
- **Generation:** **OpenRouter** (model-agnostic). Two key modes, both supported:
  1. **Default (server key):** `OPENROUTER_API_KEY` in server env, gated by a per-user
     **branch quota** so testers can't run up cost.
  2. **BYOK:** user supplies their own OpenRouter key + picks a model. Key lives in the
     **browser** (localStorage), sent over HTTPS with each generate request, used
     transiently server-side, and **never persisted or logged**. BYOK requests bypass the
     quota.
- **State/data fetching:** Server Components for reads; a thin client store (Zustand) for
  the interactive Atlas/reader selection state. No heavier state lib in MVP.

## Commands

```
Install:    npm install
Dev:        npm run dev          # next dev, http://localhost:3000
Build:      npm run build        # next build
Start:      npm run start        # serve production build
Lint:       npm run lint         # next lint (eslint)
Typecheck:  npm run typecheck    # tsc --noEmit
Test:       npm test             # vitest run
Test watch: npm run test:watch   # vitest
DB types:   npm run db:types     # supabase gen types typescript --linked > src/lib/db.types.ts
```

## Project Structure (Domain-Driven)

Organized by **domain**, not by technical layer. Each domain keeps **pure logic** (`domain/`)
separate from I/O (`infrastructure/`) and orchestration (`application/`). Next.js routes and
React components form a thin **interface** layer that calls into domain application services.
Keep it pragmatic — not every domain needs all three folders; add a layer only when it earns
its place.

```
src/
  domains/
    story/                           → AGGREGATE: a story is a tree of immutable passages
      domain/                          tree.ts (adjacency→path/breadcrumb), passage.ts (VOs), pure rules
      application/                     createStory.ts, createBranch.ts, getStoryTree.ts (use cases)
      infrastructure/                  storyRepository.ts (Supabase reads/writes)
    generation/                      → turning context into prose, provider-agnostic
      domain/                          buildPrompt.ts, ancestors.ts, parse.ts (pure)
      infrastructure/                  openrouter.ts (HTTP client; key injected, never logged)
    identity/                        → users & sessions
      application/                     bootstrapProfile.ts
      infrastructure/                  (uses Supabase auth)
    quota/                           → cost guardrails
      domain/                          quota.ts (pure: count vs. limit, window math)
      infrastructure/                  quotaRepository.ts (count nodes in 30-day window)
  app/                               → INTERFACE (thin): routes call domain application services
    (auth)/login/page.tsx              magic-link sign-in
    (app)/stories/page.tsx             story list (create + open)
    (app)/stories/[id]/page.tsx        Atlas + Reader workspace
    api/stories/route.ts               POST create story → story.createStory
    api/stories/[id]/branch/route.ts   POST branch → quota check + story.createBranch
    api/auth/callback/route.ts         magic-link callback
  components/                        → INTERFACE (UI), grouped by feature
    atlas/                             SVG tree: nodes, edges, current path, fork badges
    reader/                            passage text, breadcrumb, branch list, steer box
    settings/                          BYOK key + model picker
    ui/                                shared primitives
  lib/                               → cross-cutting shared infra (not a domain)
    supabase/{client,server}.ts        Supabase client factories
    db.types.ts                        generated Supabase types
  store/atlas.ts                     → client selection state (current node, view transform)
supabase/
  migrations/                        → SQL migrations (profiles, stories, nodes, RLS)
tests/                               → vitest unit tests, mirroring src/domains paths
SPEC.md, PRD.md, PLAN.md
```

**DDD boundaries:** the `story` aggregate owns its `nodes`; other domains touch them only
through `story`'s application services. `domain/` files import no framework/I/O code — they
are pure and the most heavily unit-tested. Repositories are the only place Supabase is
imported; the generation HTTP client is the only place OpenRouter is imported.

## Data Model

Adjacency list; the DB is the cache (passages immutable once written).

```sql
-- profiles: 1:1 with auth.users
profiles(
  id uuid pk references auth.users,
  handle text unique,
  default_model text,                 -- last-used OpenRouter model id
  created_at timestamptz default now()
)

stories(
  id uuid pk default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  premise text not null,
  genre text, tone text,
  root_node_id uuid,                  -- set after root node insert
  created_at timestamptz default now()
)

nodes(
  id uuid pk default gen_random_uuid(),
  story_id uuid references stories on delete cascade not null,
  parent_id uuid references nodes on delete cascade,   -- null = root
  content text not null,              -- the ~250-word passage (immutable)
  summary text not null,              -- short summary for cheap ancestor context
  steer text,                         -- the nudge that produced this node (null for root)
  model_used text not null,
  created_by uuid references auth.users not null,
  created_at timestamptz default now()
)
```

- **RLS:** a user can read/write only their own `stories` and `nodes` (MVP is single-player;
  sharing policies come in Phase 2).
- **Frozen cache:** there is no UPDATE path for `nodes.content`/`summary`. Reads are pure
  SELECTs; revisiting a node makes zero generation calls.
- **Quota:** count of `nodes` created by a user via the server key in a rolling window,
  checked **server-side** before any generation call (PRD §11 "cost guardrails").

## Generation Contract

Every branch call receives the **ancestor chain** for coherence (PRD §11):
`[root.summary, …, parent.summary, parent.content]` + premise/genre/tone + optional `steer`.
The model returns one ~250-word passage; we also generate (or derive) a one-line `summary`
for it in the same response, so deeper descendants stay cheap.

- Root creation: premise + genre + tone → root passage + summary.
- Branch creation: ancestor chain + steer → new passage + summary, inserted as a child node.
- Output target ~250 words (enforced in the prompt; trimmed defensively if wildly over).

## Code Style

TypeScript, functional components, server-only secrets. Example:

```tsx
// src/lib/generation/buildPrompt.ts
type AncestorContext = { summaries: string[]; lastPassage: string };

export function buildBranchMessages(
  story: Pick<Story, "premise" | "genre" | "tone">,
  ancestors: AncestorContext,
  steer: string | null,
): ChatMessage[] {
  const path = ancestors.summaries.join("\n");
  const direction = steer ? `Continue, but: ${steer}` : "Continue naturally.";
  return [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content:
        `Premise: ${story.premise}\nGenre: ${story.genre} · Tone: ${story.tone}\n\n` +
        `Story so far (summaries):\n${path}\n\nLatest passage:\n${ancestors.lastPassage}\n\n` +
        `${direction}\nWrite the next passage (~250 words).`,
    },
  ];
}
```

- Naming: `camelCase` functions/vars, `PascalCase` components/types, `kebab-case` files for
  components.
- Async/await over `.then`. No `any`; model boundaries get explicit types.
- Server Components by default; `"use client"` only where interactivity demands it.
- Keys/secrets only ever read in Route Handlers — never imported into a client component.

## Testing Strategy

- **Framework:** Vitest + React Testing Library. Tests live in `tests/` mirroring `src/`.
- **Unit (priority for MVP):** ancestor-chain assembly, prompt builder, tree layout +
  breadcrumb/path derivation, quota check. These are the logic most likely to break and the
  cheapest to cover.
- **Component:** reader panel renders passage + branch list; Atlas highlights current path,
  shows fork badges with branch counts.
- **Generation:** the OpenRouter client is mocked in unit tests (no live calls in CI).
  One optional manual/integration script can hit a cheap model behind an env flag.
- **Coverage expectation:** core `lib/` logic ≥ 80%. UI coverage is best-effort.
- **Manual verification (required before "done"):** run `npm run dev`, create a story, fork
  with and without steering, revisit a node (confirm no network/generation call), refresh and
  confirm state persists.

## Boundaries

- **Always:** run `npm run typecheck && npm run lint && npm test` before any commit; check
  quota server-side before generation; keep passages immutable; keep BYOK keys out of the DB
  and out of logs; enforce RLS on every table.
- **Ask first:** changing the data model / migrations; adding dependencies beyond those named
  here; changing the generation provider away from OpenRouter; anything that touches cost
  (quota size, default model).
- **Never:** commit secrets or `.env`; log API keys (server or BYOK); persist a BYOK key
  server-side; add an UPDATE path that regenerates a frozen passage; build sharing/social/
  discovery features in this phase; ship one-shot full-book generation.

## Success Criteria

1. A signed-in user creates a story (premise/genre/tone) and sees an AI-written ~250-word
   root passage rendered as the first node of the Atlas.
2. From any node, the user forks a branch — with or without a steer nudge — and the new
   passage appears as a child; multiple branches can coexist off one node.
3. The Atlas shows nodes/edges, highlights the current timeline, and badges fork points with
   their branch count; selecting a node re-centers and updates the reader.
4. Revisiting any existing node renders instantly and makes **zero** generation calls
   (verified via network panel + server logs).
5. All state persists across refresh and re-login (Supabase), scoped to the owning user by
   RLS.
6. Generation works in **both** key modes: server default key (quota-gated) and BYOK
   (user's OpenRouter key + chosen model, never persisted/logged).
7. `npm run typecheck && npm run lint && npm test` all pass; core `lib/` logic ≥ 80% covered.
8. **Mobile-first:** every screen (archive, create, reader, Atlas modal) is fully usable on a
   ~390px phone viewport with no horizontal overflow — headers wrap, the Atlas window fills the
   screen, and primary actions stay reachable.

## Resolved Decisions

1. **Auth:** magic link (no passwords).
2. **Summary:** model returns passage + one-line summary in a single structured response.
3. **Default model:** `OPENROUTER_DEFAULT_MODEL=openai/gpt-5.4-nano` (env-configurable).
4. **Quota:** 20 server-key branches per user per **rolling 30-day** window; BYOK bypasses it.
5. **Steer:** free-text box in the reader panel.
6. **Architecture:** Domain-Driven, organized by domain with pure `domain/` logic separated
   from `infrastructure/` I/O; Next.js routes/components are a thin interface layer.
```
