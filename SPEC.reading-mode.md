# Spec: Reading Mode + Auto-Navigate on Generate

Status: **Phase 1 (Specify) — awaiting review.** Do not implement until approved.

## Objective

Two reader UX improvements for the single-player branching reader (`Reader` /
`StoryWorkspace`):

1. **Reading mode** — a distraction-free view. Tapping the passage hides *all* chrome
   (app header, breadcrumb, steer box, fork button, branches) leaving only the passage
   **title + prose**. A floating close button and the `Esc` key exit. Reading mode
   **stays on as you navigate** between nodes within the session and resets on full reload.

2. **Auto-navigate on generate** — after a successful fork, the reader automatically
   travels to the newly generated node (instead of staying on the parent and making the
   user click it under "Branches from here"). The existing **time-jump veil animation**
   plays during the auto-travel, just like a manual jump.

3. **Breadcrumb cap (small, separate change)** — independent of reading mode, cap the
   normal-mode breadcrumb at **3 nodes** so deep trees stop overflowing on mobile. When
   the path is longer than 3, collapse the middle (e.g. `root … parent → current`).

**Users:** founder + a few testers (Phase 1 MVP). **Success =** a reader can tap into a
clean text-only view and back out; generating a branch lands them on the new passage with
the veil animation; long breadcrumbs no longer overflow a ~390px phone.

## Tech Stack

Existing only — no new dependencies. Next.js 16 App Router + TypeScript, Tailwind v4 +
the pixel CSS design system in `globals.css`, next-intl, Vitest + RTL. Client selection
state stays in React component state (no Zustand slice — reading mode is per-session).

## Commands

```
npm run dev         # next dev → http://localhost:3000
npm test            # vitest run
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run build       # production build (also runs tsc)
```

Gate before commit: `npm test && npm run typecheck && npm run lint && npm run build` green.

## Project Structure (files in play)

```
src/components/reader/Reader.tsx          # passage render, breadcrumb, steer, fork(), branches
src/components/reader/StoryWorkspace.tsx  # owns selectedId; onSelect=travel; fallback to rootId
src/components/reader/TimeVeil.tsx        # jump animation overlay (reused as-is)
src/lib/tree/path.ts                      # pathFromRoot(), childrenOf() — breadcrumb cap helper goes here
src/app/(app)/stories/[id]/page.tsx       # server page; renders StoryWorkspace; router.refresh() re-runs it
src/app/globals.css                       # pixel chrome + animations; reading-mode CSS goes here
messages/{en,pt-BR}.json                  # all user-facing copy (reader.* namespace)
tests/tree/path.test.ts                   # unit tests for the breadcrumb-cap helper
```

The app header lives outside these components (in the `(app)` layout). Hiding it for
reading mode crosses a component boundary — see Open Questions.

## Code Style

Match the existing reader. Tailwind utilities for layout/spacing; the hand-authored pixel
classes (`frame`, `chip`, `btn`, `prose`, `h2`) stay. Render-time state pattern already
used for jumps (Reader.tsx:50–56). Example, the planned reading-mode toggle on the article:

```tsx
const [reading, setReading] = useState(false);

<article
  className={`frame frame--basalt${jumpSeq > 0 ? " jump-reveal" : ""}`}
  onClick={() => !reading && setReading(true)}
  style={{ cursor: reading ? "default" : "zoom-in" }}
>
```

All copy via next-intl (`useTranslations("reader")`), keys added to **both** locale files.

## Behavior detail

### Reading mode
- **Enter:** tap/click anywhere on the passage `<article>` (title or prose). Guard so a
  text-selection drag does not trigger it (only fire on a click with no selection range).
- **Exit:** a floating close button (fixed, top-right, pixel `btn`) **and** the `Esc` key.
- **Hidden when reading:** breadcrumb `<nav>`, steer `<section data-tour="steer">`, and
  the app header.
- **Shown when reading:** the passage frame (title + prose), the **branches list**
  (`<section data-tour="branches">`) and the **Atlas FAB** — both kept as in-mode
  navigation surfaces so reading mode genuinely persists across node-to-node jumps — and
  the close button.
- **Persistence:** in-memory state that **survives node-to-node navigation** within the
  session (do not reset `reading` on `selectedId` change), resets on reload. Auto-navigate
  after a fork keeps reading mode on too.
- **Veil still plays** under reading mode when navigating.

### Auto-navigate on generate
- After `fork()` gets `{ nodeId }` and calls `router.refresh()`, the reader must select
  `nodeId`. **Sequencing risk:** `selectedId` lives in `StoryWorkspace`, and its fallback
  (`activeId = exists ? selectedId : rootId`, StoryWorkspace.tsx:34–35) snaps to root when
  the id isn't in `nodes` yet. The refreshed `nodes` prop arrives a render later than
  `router.refresh()`, so selecting `nodeId` immediately would bounce to root.
- **Resolution (pending-target handoff):** Reader reports the new id upward (e.g. an
  `onForked(nodeId)` callback). `StoryWorkspace` stores it as `pendingId` and a `useEffect`
  watching `nodes` calls `setSelectedId(pendingId)` once that node appears, then clears it.
  This guarantees the veil/jump fires exactly when the node is real, with no root-bounce.

### Breadcrumb cap
- Pure helper (in `lib/tree/path.ts`) that takes the full `pathFromRoot` trail and returns
  a capped view. When the trail is longer than 3, show **3 nodes + an ellipsis**:
  `root … parent → current` (root, second-to-last, last visible; ellipsis marks the
  collapsed middle). Trails of length ≤3 are returned unchanged. Reader renders an
  ellipsis chip for the collapsed gap. Root and current are always shown.

## Testing Strategy

Vitest + RTL. Per repo TDD rules, **pure logic gets unit tests; UI is verified in the
browser, not asserted in unit tests.**

- **Unit (RED→GREEN):** the breadcrumb-cap helper in `tests/tree/path.test.ts` — trails of
  length 1, 2, 3 (unchanged) and 4+ (collapsed to root + ellipsis + current), order
  preserved.
- **Browser verification (manual, at ~390px):**
  - Tap passage → only title+prose+close remain; header/breadcrumb/steer/branches/FAB gone.
  - Close button and `Esc` both exit.
  - Navigate node→node while reading → stays in reading mode; veil plays.
  - Fork a branch → lands on the new node with the veil; no flash of root.
  - Reload → reading mode off.
  - Long path → breadcrumb shows ≤3 chips, no horizontal overflow.

## Boundaries

- **Always:** run the full gate before commit; add copy to both locale files; keep the
  passage-immutability and server-only-secret invariants untouched (these features are
  client-render only — no API/generation change beyond reading the existing `nodeId`).
- **Ask first:** any change to how the app header renders (crossing the `(app)` layout
  boundary — see Open Questions); adding a Zustand slice; changing the branch API contract.
- **Never:** add an UPDATE/regenerate path to passages; persist reading mode server-side;
  introduce a new dependency for this.

## Success Criteria

- [ ] Tapping the passage enters a text-only view; close button **and** `Esc` exit it.
- [ ] In reading mode, header, breadcrumb, steer, fork, branches, and Atlas FAB are hidden;
      only title + prose + close button render.
- [ ] Reading mode persists across node navigation in a session; resets on reload.
- [ ] After a successful fork, the reader auto-travels to the new node with the veil
      animation and **never** flashes the root passage.
- [ ] Normal-mode breadcrumb renders ≤3 chips and does not overflow at ~390px.
- [ ] `npm test && npm run typecheck && npm run lint && npm run build` all green.

## Resolved Decisions

1. **App-header hiding → `data-reading` on `<html>` + CSS.** Reading mode toggles a
   `data-reading` attribute on the document element; a CSS rule in `globals.css` hides the
   app header (and Atlas FAB) while it's set. No `(app)`-layout refactor, fully reversible.
2. **Tap nuance → ignore text selection.** Tapping the passage enters reading mode *unless*
   the user is selecting text (non-empty selection range), in which case the tap is ignored.
3. **Breadcrumb collapse → 3 + ellipsis.** When capped: `root … parent → current`.

## Tasks (Phase 3)

Ordered by dependency. Each ≤5 files, with its own RED→GREEN→gate→commit slice.

### A — Breadcrumb cap

- [ ] **A1: `cappedTrail` pure helper (RED→GREEN)**
  - Acceptance: `cappedTrail(trail)` returns the trail unchanged for length ≤3; for length
    ≥4 returns `[root, gapMarker, secondToLast, last]` where `gapMarker` is a sentinel the
    UI renders as an ellipsis. Order preserved; root and current always present.
  - Verify: `npm test tests/tree/path.test.ts` — cases for lengths 1, 2, 3 (unchanged) and
    4, 6 (collapsed). Then `npm run typecheck`.
  - Files: `src/lib/tree/path.ts`, `tests/tree/path.test.ts`.

- [ ] **A2: render capped breadcrumb**
  - Acceptance: Reader breadcrumb maps over `cappedTrail(pathFromRoot(...))`; the gap marker
    renders as a non-interactive ellipsis chip; real chips still call `onSelect`.
  - Verify: browser at ~390px with a depth-5+ story — ≤3 chips + ellipsis, no horizontal
    overflow. Full gate green.
  - Files: `src/components/reader/Reader.tsx`.

### B — Auto-navigate on generate

- [ ] **B1: pending-target handoff in StoryWorkspace**
  - Acceptance: `StoryWorkspace` holds `pendingId` state; a `useEffect` keyed on `nodes`
    sets `selectedId` to `pendingId` once that node exists in `nodes`, then clears it.
    A new `onForked(id)` prop is passed to `Reader`.
  - Verify: typecheck; no root-bounce reasoning confirmed (selection only moves when node
    is present).
  - Files: `src/components/reader/StoryWorkspace.tsx`.

- [ ] **B2: fork() reports the new node**
  - Acceptance: after `router.refresh()`, `fork()` calls `onForked(data.nodeId)`. Demo and
    quota-exceeded paths unchanged (no navigation on failure).
  - Verify: browser — fork a branch → auto-travels to the new passage with the veil; no
    flash of root; error/demo paths still behave. Full gate green.
  - Files: `src/components/reader/Reader.tsx`.

### C — Reading mode

- [ ] **C1: reading state + tap-to-enter (selection-guarded)**
  - Acceptance: `reading` state in `Reader`; clicking the `<article>` enters reading mode
    unless `window.getSelection()` has a non-empty range; `reading` is NOT reset on
    `selectedId` change (persists across navigation).
  - Verify: browser — tap enters; dragging to select text does not. Typecheck.
  - Files: `src/components/reader/Reader.tsx`.

- [ ] **C2: hide chrome + close affordances**
  - Acceptance: while `reading`, the breadcrumb `<nav>`, steer `<section>`, and branches
    `<section>` are not rendered; a fixed close button (pixel `btn`, top-right) and an
    `Esc` keydown listener both exit reading mode.
  - Verify: browser at ~390px — only title+prose+close visible; close button and Esc exit.
  - Files: `src/components/reader/Reader.tsx`.

- [ ] **C3: hide header + FAB via `data-reading`**
  - Acceptance: a `useEffect([reading])` sets/clears `document.documentElement.dataset.reading`
    and cleans up on unmount; a `globals.css` rule hides `.app-header` and `.atlas-fab`
    while set.
  - Verify: browser — header + Atlas FAB disappear in reading mode and reliably return on
    exit and on leaving the page (no stuck attribute).
  - Files: `src/components/reader/Reader.tsx`, `src/app/globals.css`.

- [ ] **C4: i18n copy**
  - Acceptance: `reader.exitReading` (close button aria-label/text) added to both locale
    files; read via `useTranslations("reader")`.
  - Verify: both `messages/en.json` and `messages/pt-BR.json` have the key; UI shows it.
    Full gate green.
  - Files: `messages/en.json`, `messages/pt-BR.json`, `src/components/reader/Reader.tsx`.
```
