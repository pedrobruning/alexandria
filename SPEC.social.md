# Spec: Social Layer — Visibility, Stars, and Forks

> Feature spec. Extends `SPEC.md` (the Phase-1 source of truth). This deliberately
> re-scopes the Phase-1 line *"Social/sharing/discovery are out of scope"*: that
> exclusion is now lifted for the three features below. Update `SPEC.md`'s scope
> note and the *Locked decisions* list when this lands.

## Objective

Let a signed-in user share a story and engage with other users' stories, using the
GitHub mental model:

- **Visibility** — each story is `private` (owner only, default), `unlisted`
  (readable by anyone with the link, not discoverable), or `public` (readable and
  listed on a browse page).
- **Stars** — a user can star/unstar any story they can see (not their own). Star
  counts are shown and used to sort the browse page.
- **Forks** — a user can fork a story they can see into a **full immutable copy**
  they own (private by default), with attribution back to the source. They then
  branch/steer the fork normally, spending their *own* quota. Copying costs **zero
  generations** (consistent with "the DB is the cache").
- **Browse** — an `/explore` page lists public stories (recent / most-starred) with
  author handle, star count, and a fork affordance.

### User stories

1. As an owner, I can set my story's visibility from the reader and see the current state.
2. As a viewer, I can open a public/unlisted story read-only — no steer/branch controls.
3. As a viewer, I can star and unstar a story I can see, and see its star count.
4. As a viewer, I can fork a visible story; the copy lands in my Archive, private, with
   "forked from …" attribution, and I can immediately branch it.
5. As a browser, I can discover public stories on `/explore`, sorted by recent or stars.

### Non-goals (still out of scope)

Comments, follows/feeds, notifications, profiles/handles UI beyond a display name,
pull-requests/merge-back, edit history, moderation/reporting, pagination beyond a
simple limit, real-time counts.

## Tech Stack

Unchanged from `SPEC.md`: Next.js 16 App Router · TypeScript · Supabase (Postgres + Auth, RLS) ·
OpenRouter · Tailwind v4 + pixel design system · next-intl · Zustand · Vitest + RTL.

## Commands

Unchanged. Gate before each slice commits:
`npm test && npm run typecheck && npm run lint && npm run build` all green.
Regenerate DB types after each migration: `npm run db:types`.

## Data Model Changes

New migration(s) under `supabase/migrations/` (next number is `0006_*`).

### `stories`

```sql
alter table public.stories
  add column if not exists visibility text not null default 'private'
    check (visibility in ('private','unlisted','public')),
  add column if not exists forked_from_story_id uuid
    references public.stories (id) on delete set null;

create index if not exists stories_visibility_idx on public.stories (visibility);
```

- `visibility` defaults `private` — every existing story stays owner-only after migration.
- `forked_from_story_id` is the attribution pointer; `on delete set null` so deleting a
  source degrades attribution gracefully rather than blocking deletion. (Attribution text
  disappears if the source is deleted; acceptable for MVP.)
- Star counts are **derived** (aggregate over `stars`), not denormalized — matches the
  existing `passageCount` pattern in `listStories`. Denormalize later if browse gets slow.

### `nodes`

```sql
alter table public.nodes
  add column if not exists imported boolean not null default false;
```

- `imported = true` marks fork-copied passages. They are **excluded from quota** (they are
  copies, not generations). Branches the forker later generates off an imported node are
  `imported = false` and count normally.

### `stars` (new)

```sql
create table if not exists public.stars (
  user_id    uuid not null references auth.users (id) on delete cascade,
  story_id   uuid not null references public.stories (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, story_id)
);
create index if not exists stars_story_id_idx on public.stars (story_id);
```

### `public_profiles` view (new) — expose only `id`, `handle`

Browse must show author handles, but `profiles` is owner-only RLS and contains other
columns (`default_model`, `onboarded_at`). A column-limited view avoids widening profile
RLS and leaking those columns:

```sql
create or replace view public.public_profiles as
  select id, handle from public.profiles;
grant select on public.public_profiles to authenticated, anon;
```

(A view runs with its definer's privileges, bypassing the underlying table RLS — which is
exactly what we want here since `id` + `handle` are public display data and nothing else is
exposed.)

## RLS Changes (the load-bearing part)

### `stories` — widen SELECT, keep writes owner-only

```sql
drop policy if exists "stories_select_own" on public.stories;
create policy "stories_select_visible"
  on public.stories for select
  using (auth.uid() = user_id or visibility in ('public','unlisted'));
```

`insert`/`update`/`delete` policies are **unchanged** (owner-only). `unlisted` is readable
only *by id* — RLS cannot distinguish "has the link", and possessing the UUID id *is* the
link. The browse page filters to `visibility = 'public'` in the query, not via RLS.

### `nodes` — read follows the story; writes stay owner-only

```sql
drop policy if exists "nodes_select_own" on public.nodes;
create policy "nodes_select_visible"
  on public.nodes for select
  using (
    exists (
      select 1 from public.stories s
      where s.id = nodes.story_id
        and (s.user_id = auth.uid() or s.visibility in ('public','unlisted'))
    )
  );
```

`nodes_insert_own` is **unchanged**: it still requires both `auth.uid() = created_by` and
ownership of the parent story, so opening reads does **not** open writes. This is the
invariant that keeps "passages are immutable / owner-only writes" intact.

### `stars` (new policies)

```sql
alter table public.stars enable row level security;

-- See stars on stories you can see (powers counts on public stories + your own).
create policy "stars_select_visible"
  on public.stars for select
  using (
    exists (
      select 1 from public.stories s
      where s.id = stars.story_id
        and (s.user_id = auth.uid() or s.visibility in ('public','unlisted'))
    )
  );

-- Star a story you can see, that isn't your own.
create policy "stars_insert_own"
  on public.stars for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.stories s
      where s.id = story_id
        and s.user_id <> auth.uid()
        and s.visibility in ('public','unlisted')
    )
  );

create policy "stars_delete_own"
  on public.stars for delete
  using (auth.uid() = user_id);
```

No UPDATE policy (stars are toggled by insert/delete).

## Regression Risks From Widening RLS (must-fix)

Several existing reads relied **implicitly** on owner-only RLS. Widening SELECT will change
their results unless they add explicit filters:

1. **`listStories` (Archive)** — `src/domains/stories/infrastructure/supabaseStoryReader.ts`.
   Add `.eq("user_id", userId)` to the stories query, and scope the node-count query to the
   user's story ids (or `.eq("created_by", userId)` won't work for counts of imported nodes —
   scope by the user's story ids). **Otherwise the Archive lists strangers' public stories.**
   Requires threading `userId` into `listStories`.
2. **`findDemoStory`** — add `.eq("user_id", userId)`. Demos stay `private` so RLS still
   scopes them, but make it explicit (defense in depth).
3. **`getStory`** — now intentionally returns public/unlisted stories to non-owners (desired
   for the reader). Must additionally return the owner id + visibility so the reader can render
   read-only for non-owners. Add `userId`/`isOwner` to `StoryDetail`.
4. **`getBranchContext`** — now returns public stories to non-owners. The **branch route must
   reject non-owners before generating** (today it counts quota and calls OpenRouter *before*
   the insert, so a non-owner would burn a generation then fail at the insert RLS). Add the
   owner id to `BranchContext` and return `403` early if `ownerId !== user.id`.
5. **`countQuotaNodes`** — add `.eq("imported", false)` so fork copies never count. (Its
   `created_by` filter is unaffected by the widened read policy.)

## Fork Semantics (full immutable copy)

Use case `forkStory` (new), `src/domains/stories/application/forkStory.ts`.

1. Load the source story (must be readable via RLS) + its full node tree. Reject self-fork
   (`source.user_id === userId`) with a clear error — owners branch their own story directly.
2. Build the copy with **pure domain functions** (testable, no I/O):
   - `remapTree(nodes)` → new uuids, remapped `parent_id`, old→new id map, identifies the new
     root id.
   - `orderForInsert(nodes)` → parent-before-child ordering (FK requires parents first).
3. Persist (adapter `supabaseForkWriter`):
   - Insert a new `stories` row owned by the caller: copy `title` (optionally suffix), `premise`,
     `genre`, `tone`, `language`; `visibility = 'private'`; `is_demo = false`;
     `forked_from_story_id = source.id`.
   - Insert copied nodes in order with `story_id = new`, `created_by = caller`, `imported = true`,
     preserving `title`/`content`/`summary`/`steer`/`model_used`. `created_by = caller` is
     required to satisfy `nodes_insert_own`; `imported = true` keeps them out of quota.
   - `setRootNode(newStoryId, remappedRootId)`.
4. Return the new story id (route redirects to its reader).

**Atomicity:** the copy is multiple inserts and is **not** transactional from the JS client —
this matches the existing non-atomic `createStory` (story → node → update) the codebase already
accepts. A half-fork is possible on mid-failure; acceptable for MVP. Hardening path (deferred):
a `security invoker` Postgres `fork_story(source_id)` RPC that copies in one transaction.

## Interface Layer (routes + UI)

### Routes (Route Handlers, `runtime = "nodejs"`, auth-gated)

- `PATCH /api/stories/[id]` — set visibility. Body `{ visibility }`, validated against the
  three states. RLS update policy already enforces owner-only; return `403`/`404` cleanly.
- `POST /api/stories/[id]/fork` — fork. Returns `{ storyId }` (201). `403` on self-fork,
  `404` if source not visible.
- `POST /api/stories/[id]/star` / `DELETE /api/stories/[id]/star` — toggle star.

### UI (mobile-first ~390px, pixel design system, all copy via next-intl en + pt-BR)

- **Reader** (`(app)/stories/[id]`): if non-owner → read-only (hide steer + branch-create,
  keep navigation); show **Star** (with count) and **Fork** buttons; show "forked from …"
  attribution when present. If owner → a **visibility control** (Private/Unlisted/Public) +
  a copy-link affordance for unlisted/public.
- **Explore** (`(app)/explore`, new): grid of public-story cards (reuse/extend `StoryCard`):
  title, genre/tone, author handle (via `public_profiles`), star count, passage count, Star +
  Fork. Sort toggle: recent (default) / most-starred. Simple `limit` (e.g. 50), no pagination.
- **Archive**: badge a story's visibility; show star count on owned public stories; link to
  Explore in the header menu.

## Project Structure (additions)

```
src/domains/stories/
  domain/fork.ts                 remapTree, orderForInsert (PURE)
  application/forkStory.ts        use case + ForkWriter port
  application/setVisibility.ts    use case + port (or thin route + adapter)
  infrastructure/supabaseStoryWriter.ts   + supabaseForkWriter
  infrastructure/supabaseStoryReader.ts   + getExploreStories, + ownership/visibility on reads
src/domains/social/              (new domain) stars
  domain/                        any pure star logic (likely minimal)
  application/toggleStar.ts
  infrastructure/supabaseStarStore.ts
src/app/(app)/explore/page.tsx
src/app/api/stories/[id]/fork/route.ts
src/app/api/stories/[id]/star/route.ts
src/app/api/stories/[id]/route.ts          (PATCH visibility)
src/components/stories/                     VisibilityControl, StarButton, ForkButton
tests/stories/fork.test.ts, tests/stories/forkStory.test.ts, tests/social/toggleStar.test.ts
supabase/migrations/0006_social.sql
```

Respect DDD: `domain/` pure; Supabase only in `*/infrastructure/supabase*`; camelCase domain ↔
snake_case DB mapping in adapters; the `stories` aggregate owns `nodes`.

## Testing Strategy

- **Unit (Vitest, fakes — no real DB/network):** `remapTree`/`orderForInsert` (tree shape,
  id remap, ordering, single-node and deep trees); `forkStory` use case (self-fork rejection,
  imported flag set, root remapped, visibility=private); `toggleStar` use case; visibility input
  validation. These follow the existing TDD pattern under `tests/` mirroring source paths.
- **RLS / cross-user (cannot be faked):** the highest-risk surface. Document a manual/integration
  checklist (and ideally a SQL-level test against a local Supabase) covering:
  - private story + its nodes NOT readable by another user; public/unlisted readable.
  - non-owner CANNOT branch (early `403`, **no** generation spent) and CANNOT insert nodes.
  - non-owner CANNOT PATCH visibility.
  - star insert allowed on a visible non-own story; blocked on private and on self.
  - unlisted story readable by id but absent from `/explore`.
  - Archive shows only the caller's own stories after the RLS widening.
- **UI:** verified in the browser at ~390px and desktop, not asserted in unit tests.

## Boundaries

- **Always:** run the full gate before each commit; add i18n keys to both message files; keep
  `domain/` pure; thread the request-bound server client (RLS is the authz boundary); verify new
  UI at ~390px.
- **Ask first:** any change to the widened RLS predicates; denormalizing star counts; adding a
  payment/credits surface (separate spec); adding a `fork_story` RPC.
- **Never:** query user data with a service-role client from a route; expose `profiles` columns
  beyond `id`+`handle`; add an UPDATE path to `nodes` (immutability); let the server key reach a
  client bundle/response/log; count imported nodes against quota.

## Success Criteria

1. A new migration adds `visibility`, `forked_from_story_id`, `nodes.imported`, `stars`, and the
   `public_profiles` view; `npm run db:types` regenerates cleanly; gate is green.
2. Default state unchanged: pre-existing and newly created stories are `private` and behave
   exactly as before (Archive shows only the owner's stories; reader fully interactive for owner).
3. Setting a story `public`/`unlisted` makes it (and its passages) readable by another signed-in
   user; setting it back to `private` revokes that access. Verified cross-user.
4. A non-owner viewing a public story sees a read-only reader (no steer/branch), can star/unstar
   (count updates), and can fork.
5. Forking produces an owned private copy with the identical tree and "forked from …"
   attribution; the forker's quota is **unchanged** by the copy; branching the fork works and
   spends the forker's quota normally.
6. A non-owner attempting to branch a public story is rejected with `403` and **no generation is
   spent** (no OpenRouter call, no quota increment).
7. `/explore` lists only public stories with author handle + star count, sortable by recent /
   most-starred; unlisted stories never appear there.
8. All new copy is translated in `messages/en.json` and `messages/pt-BR.json`.

## Resolved Decisions

1. **Handles** — show "anonymous" when `profiles.handle` is null. Handle capture stays a separate,
   later task; it does not block this feature.
2. **Title on fork** — keep the source title as-is (no suffix).
3. **Re-forking** — fork-of-a-fork is allowed; `forked_from_story_id` points to the immediate source.
4. **Demo story** — stays `private`, non-forkable, non-starrable (per-user onboarding).
5. **Atlas** — independent of this feature; no interaction assumed.

---

## Phase 2: Implementation Plan

**Build order is dependency-driven.** The migration is the foundation; the regression fixes for
the widened RLS must land *with or immediately after* the migration so the Archive never leaks;
visibility/stars/fork/explore layer on top and are largely independent of each other.

```
T1 migration ──┬─→ T2 tighten owner reads ──→ T4 visibility ──┐
               │                                              ├─→ T7 explore ─→ T8 i18n + verify
               ├─→ T3 branch owner-guard                      │
               ├─→ T5 stars ─────────────────────────────────┤
               └─→ T6 fork ──────────────────────────────────┘
```

- **Critical path / highest risk:** T1 + T2 + T3. Until the owner-scoped reads are tightened, the
  widened SELECT policy leaks other users' public stories into the Archive, and a non-owner can
  burn a generation on someone else's story. These ship together and get cross-user verification.
- **Parallelizable after T1+T2:** T5 (stars), T6 (fork), T4 (visibility) touch mostly disjoint
  files. T7 (explore) depends on T4/T5/T6 affordances.
- **Verification checkpoints:** full gate (`npm test && npm run typecheck && npm run lint &&
  npm run build`) after every task; cross-user RLS checklist after T3 and again after T7.

## Phase 3: Task Breakdown

Each task is TDD where pure logic exists (RED test first), ≤ ~5 files, ends green on the gate.

- [ ] **T1 — Migration: schema + RLS + view.**
  - Acceptance: `0006_social.sql` adds `stories.visibility` (+check, default private) &
    `forked_from_story_id`, `nodes.imported`, `stars` table + policies, widened
    `stories_select_visible` / `nodes_select_visible`, `public_profiles` view + grant.
    `db.types.ts` regenerated.
  - Verify: migration applies on local Supabase; `npm run db:types` clean; gate green.
  - Files: `supabase/migrations/0006_social.sql`, `src/lib/db.types.ts`.

- [ ] **T2 — Tighten owner-scoped reads + quota for widened RLS.**
  - Acceptance: `listStories` takes `userId` and filters stories + node counts to the owner;
    `findDemoStory` filters by `user_id`; `countQuotaNodes` adds `.eq("imported", false)`.
    Archive page passes `user.id`.
  - Verify: existing tests green; new test asserts a foreign public story is excluded from the
    owner's list (use-case/adapter-level where feasible); gate green; manual: Archive shows only
    own stories.
  - Files: `supabaseStoryReader.ts`, `supabaseQuotaCounter.ts`, `(app)/stories/page.tsx`,
    tests.

- [ ] **T3 — Branch route ownership guard.**
  - Acceptance: `getBranchContext` returns `ownerId`; branch route returns `403 not_owner`
    **before** quota check / generation when `ownerId !== user.id`.
  - Verify: unit/route reasoning + manual cross-user: non-owner branch attempt → 403, no
    OpenRouter call, no quota increment; gate green.
  - Files: `supabaseStoryReader.ts` (BranchContext type), `api/stories/[id]/branch/route.ts`,
    tests.

- [ ] **T4 — Visibility: read model + PATCH route + reader read-only + control.**
  - Acceptance: `getStory` returns owner/visibility (`isOwner`, `visibility`); reader hides
    steer/branch-create for non-owners; owner sees a `VisibilityControl`; `PATCH
    /api/stories/[id]` validates + sets visibility (owner-only via RLS).
  - Verify: unit test for visibility validation; manual: toggle public/unlisted/private, confirm
    cross-user read access flips; gate green.
  - Files: `supabaseStoryReader.ts`, `domain/types.ts`, `api/stories/[id]/route.ts`,
    `(app)/stories/[id]/page.tsx` (+ reader components), `components/stories/VisibilityControl.tsx`.

- [ ] **T5 — Stars: domain/use case + adapter + route + button.**
  - Acceptance: `social` domain with `toggleStar` use case + `StarStore` port +
    `supabaseStarStore`; `POST`/`DELETE /api/stories/[id]/star`; `StarButton` with count; reader
    shows star state/count for non-owned visible stories.
  - Verify: unit test `toggleStar` (star/unstar, self-star rejected); manual cross-user star;
    gate green.
  - Files: `domains/social/application/toggleStar.ts`, `domains/social/infrastructure/supabaseStarStore.ts`,
    `api/stories/[id]/star/route.ts`, `components/stories/StarButton.tsx`, tests.

- [ ] **T6 — Fork: pure tree ops + use case + adapter + route + button + attribution.**
  - Acceptance: pure `remapTree`/`orderForInsert`; `forkStory` use case + `ForkWriter` port +
    `supabaseForkWriter` (new story private, copied nodes `imported=true`, root remapped,
    `forked_from_story_id` set, self-fork rejected); `POST /api/stories/[id]/fork` → redirect
    target; `ForkButton`; reader shows "forked from …".
  - Verify: unit tests for `remapTree`/`orderForInsert`/`forkStory`; manual: fork a public story,
    confirm identical tree, private, attribution, quota unchanged, then branch it; gate green.
  - Files: `domain/fork.ts`, `application/forkStory.ts`, `infrastructure/supabaseStoryWriter.ts`
    (+forkWriter), `api/stories/[id]/fork/route.ts`, `components/stories/ForkButton.tsx`, tests.

- [ ] **T7 — Explore page.**
  - Acceptance: `getExploreStories` (public only, star + passage counts, author handle via
    `public_profiles`, sort recent/most-starred, limit ~50); `(app)/explore/page.tsx` grid reusing
    card with Star + Fork; header-menu link; unlisted never listed.
  - Verify: manual: public story appears, unlisted does not, sort toggle works, star/fork from a
    card; gate green.
  - Files: `supabaseStoryReader.ts` (getExploreStories), `(app)/explore/page.tsx`,
    `components/stories/StoryCard.tsx` (extend), nav.

- [ ] **T8 — i18n + scope doc update + cross-user verification pass.**
  - Acceptance: all new copy in `messages/en.json` + `messages/pt-BR.json`; `SPEC.md` scope note
    & Locked decisions updated to reflect social layer; full cross-user RLS checklist (Testing
    Strategy) walked manually.
  - Verify: gate green; checklist all pass.
  - Files: `messages/en.json`, `messages/pt-BR.json`, `SPEC.md`, `PLAN.md`.
```
