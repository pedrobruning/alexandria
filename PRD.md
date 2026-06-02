# PRD — Alexandria: Branches

**A branching, shareable AI fiction platform**

| | |
|---|---|
| **Author** | Pedro |
| **Status** | Draft / pre-build |
| **Last updated** | June 1, 2026 |
| **Type** | Part-time micro-SaaS |
| **Working stack** | Supabase + Claude API + React (founder's existing toolchain) |
| **Target outcome** | $1–5k MRR part-time; possible 3–5x acquisition later |

---

## 1. TL;DR

Alexandria began as a one-shot "type a premise, get a whole AI book" generator. Research and a hard look at the model showed that concept is a **great demo and a bad business**: no moat, fast churn, no clear buyer, hostile platform dependency (Amazon KDP), and economics that fight you.

The product this PRD specifies is the pivot: **a story is a tree, not a line.** Users start a story, then fork it at any passage into alternate timelines — optionally *steering* each branch ("but she refuses the offer"). Branches, once written, are **frozen** and free to revisit forever. Stories are **shareable** so others can read and fork them.

The pivot fixes the one criticism that mattered most — **the moat** — by moving value from the commodity (LLM generation) to assets a competitor can't copy: the accumulated library, the branch trees, and the reader graph. It also unlocks a genuinely favorable cost structure (the **write-once cache**, see §7).

The two new risks it introduces — **two-sided-platform cold start** and **reader-triggered generation cost** — are real and must be sequenced around deliberately (see §6, §7). The recommended approach: **ship the single-player branching experience first, keep sharing lightweight, defer the social network** until there is content worth browsing.

---

## 2. Background — how we got here

### 2.1 The original concept (rejected)
"Alexandria v0": user enters a premise, picks genre/tone/chapter count, the app drafts an outline then writes every chapter sequentially. A polished prototype was built. The problems:

- **One-shot churn.** User generates a book and leaves; nothing brings them back. AI apps already retain only ~21% of subscribers at 12 months vs. ~31% for non-AI apps (RevenueCat 2026). "Generate my thing and go" is the worst-retaining version of an already-bad-retaining category.
- **No moat.** The core is "send a prompt to an LLM." Clonable in a weekend; the model providers already do it for free.
- **Mediocre-by-architecture output.** Per-chapter calls that only see prior *summaries* drift in character, plot, and voice — worse the longer the book.
- **No clear buyer.** Serious authors want a co-writer, not a replacement; hobbyists won't pay monthly; KDP spammers are Amazon-hostile (3 uploads/day cap, AI-disclosure rules) and a race to the bottom.
- **Negative brand signal.** "AI-generated book" is sliding toward a liability; pure AI text isn't copyrightable in the US (Copyright Office, Jan 2025).

### 2.2 Market context (from research, condensed)
- **Market size (narrow scope):** AI writing assistant software ~$1.77B (2025) → ~$4.88B (2030), ~22% CAGR (Mordor Intelligence). Treat any "$90B+" figures as conflated with the whole AI market.
- **What retains:** *co-writing* tools that assist serious authors (Sudowrite, Novelcrafter) retain and monetize; *one-shot* generators don't.
- **Competitor signals:** Sudowrite ~$1.8M ARR, bootstrapped, ~1.2M monthly visits; Novelcrafter ~330k visits/mo, 157k+ authors, popular for its BYOK + "Codex" consistency system; Squibler ~600k visits/mo.
- **Adjacent to the branching concept specifically:** AI Dungeon (Latitude), NovelAI, Character.AI, Wattpad/Royal Road/AO3. The *branching, shareable library* angle is less crowded than "AI story chat," but it sits next to well-funded players.
- **Revenue realism:** ~18% of micro-SaaS reach the $1–5k MRR band; ~70% earn under $1k MRR (Freemius 2025). Pedro's goal is attainable but a minority outcome, gated on distribution.
- **Exit realism:** Thin AI wrappers get offered ~2–3x (buyers are buying the user list); defensible workflow SaaS trades ~4.8–7x ARR. The moat roughly doubles exit value.

> **Data confidence:** churn, exit-multiple, and competitor-traction figures are well-sourced; precise search-volume and the exact traffic/revenue of small newer tools (Youbooks, Automateed, etc.) were not verified and should be checked with a paid Similarweb/Semrush lookup before any bet that depends on them.

---

## 3. Strategic thesis

1. **Move the value off the commodity.** Generation is free/cheap and clonable. The defensible assets are the **content library**, the **branch trees**, and (eventually) the **reader/author graph**. Build the moat, not the generator.
2. **Branching neutralizes the AI-stigma problem.** In a "definitive novel" frame, AI authorship is a liability. In a "what if the hero took the other door" frame, it's the *feature*. Readers of interactive fiction *want* AI generation.
3. **The write-once cache flips the economics** (see §7). Unlike per-play generators, a frozen branch is paid for once and served free forever — cost per read trends toward zero as a story gets popular.
4. **Retention comes from exploration, not consumption.** Revisiting alternate timelines, steering new branches, and reading others' trees create return visits — the loop the one-shot version completely lacked.

---

## 4. Target user & the core unresolved decision

**The fork in the road (must be decided before v1 scope locks):**

| Direction | Core fantasy | Competes with | Implication |
|---|---|---|---|
| **A — Authoring** | "I craft a branching story others explore" | Interactive-fiction tooling (Twine, ChoiceScript), Novelcrafter | Power-author tooling, fewer/deeper users, content-creation UX |
| **B — Exploring** | "I drop into a story and fork it myself" | AI Dungeon, Character.AI | Mass-market play, lighter UX, reader-triggered cost is central |

**Recommendation:** Validate with the prototype (§9) by gut-check — *which pulls you in more, authoring a tree or forking someone else's?* The honest answer picks the product. Default lean for a part-time solo founder: **start single-player exploration (B-flavored) with authoring affordances, defer the social layer.**

**Primary persona (working assumption):** hobbyist/creative reader-writers (the Wattpad/AO3/AI-Dungeon audience) who enjoy "what if" exploration and light creation — not professional novelists chasing a publishable manuscript.

---

## 5. Product overview & core concepts

- **Story Atlas** — a story is a *tree*; the current path renders as a highlighted "timeline," forks are visible nodes.
- **Passage (node)** — a short (~250-word) unit of prose. Short by design so branching is fast and the tree, not chapter length, is the experience.
- **Branch / fork** — generate a continuation from any node. Multiple continuations from one node = parallel timelines that coexist.
- **Steering** — an optional nudge per branch ("but she refuses the offer"). *This is the actual product* — directed branches are a reason to keep exploring; random ones are a toy.
- **Frozen branch** — once written, a passage never regenerates. Revisiting is instant and free (the cache, §7).
- **Sharing** — a story (its whole tree) is shareable by link so others can read and fork. **Lightweight first** (links), full social graph later.

---

## 6. Feature requirements (prioritized)

### MVP (single-player, ship first)
- [ ] **Mobile-first experience:** the core loop (create → read → steer-fork → revisit → Atlas) is designed and built for a phone first and must be fully usable on a ~390px viewport; desktop is a progressive enhancement, not the primary target.
- [ ] Story creation: premise + genre + tone → AI writes the root passage.
- [ ] Tree view (Story Atlas): nodes, edges, highlighted current path, fork badges, pan/scroll, auto-center on selection.
- [ ] Reader view: full passage text, breadcrumb path, list of existing branches from current node.
- [ ] Branch generation with optional steering nudge; multiple branches per node.
- [ ] Frozen/cached passages: revisiting any node is instant and makes **zero** API calls.
- [ ] Persistence: stories saved per user (Supabase), survive refresh/sessions.
- [ ] Coherence: each generation receives the ancestor chain (summaries + last passage text) so branches stay consistent down a path.
- [ ] Account/auth.

### v1 (lightweight sharing + retention)
- [ ] Shareable read-only/forkable link to a story tree.
- [ ] "Fork from here" for visitors (creates their own copy/branch).
- [ ] Cost controls: per-user branch quota and/or **BYOK** (bring your own API key).
- [ ] Story metadata: title, cover/genre, author handle.
- [ ] Basic export (Markdown of a chosen path).

### Later (only once there is content worth browsing)
- [ ] Discovery/browse, likes, follows, comments — the actual social network.
- [ ] Popular-branch surfacing; "most-explored timeline."
- [ ] Collaborative trees (multiple authors).
- [ ] Long-context coherence engine (RAG/"story bible" — see §11), leveraging founder's RAG/MCP depth.
- [ ] Monetization tiers (§7).

**Anti-requirements (explicitly out of scope):** one-shot full-book generation; KDP/publishing export pipeline; chasing professional-novelist manuscript workflows in MVP; building the social feed before content exists.

---

## 7. Unit economics & monetization

**The write-once cache (core economic insight):**
- Creating a new branch = **one** paid LLM call.
- Reading any existing branch = **zero** cost (served from DB).
- Therefore cost scales with *branch creation*, not *engagement*. A popular tree's cost-per-read trends to zero — the opposite of AI Dungeon's "every play is fresh generation" curse.

**Cost-control levers (must ship at v1):**
1. **BYOK** — users supply their own API key. Kills the cost risk entirely, fits a technical/creative early-adopter audience, and is a proven model (Novelcrafter). Strong default for the part-time stage.
2. **Branch credits / quotas** — free tier gets N branches; paid tiers get more.
3. Cap or rate-limit forking so power users can't run up dead-end branches nobody reads.

**Candidate monetization:**
- Free: read + limited branching of own/shared stories.
- Pro subscription (~$8–15/mo): higher/unlimited branch quota, private stories, export, premium models.
- BYOK tier: low/flat fee, user pays generation directly.

**Realism:** target the ~18% outcome band ($1–5k MRR). Distribution, not the build, is the gating factor.

---

## 8. Go-to-market / distribution

- **Communities first:** interactive-fiction, AI-fiction, and writing subreddits/Discords; r/WritingWithAI-type spaces; AI Dungeon / NovelAI adjacent communities.
- **Shareable artifact = built-in loop:** every shared story link is an acquisition surface (the share mechanic *is* the growth channel).
- **Content/SEO:** "branching AI story," "interactive fiction generator," "what-if story" long-tail.
- **Launch surfaces:** Product Hunt, relevant subreddits, X/Twitter build-in-public; AppSumo only if/when there's a paid tier worth bundling.
- **Avoid:** competing head-on with Wattpad/AO3 on social-network breadth, or KDP-spam audiences.

---

## 9. Prototype status (already built)

`AlexandriaBranches.jsx` — a working React prototype validating the **branching mechanic**:
- Start-screen (premise/genre/tone) → AI root passage.
- Live **Story Atlas** tree (gold = current timeline, cyan badge = fork point with branch count).
- Reader panel with clickable breadcrumb + existing-branch list.
- **Steerable** branch generation; multiple timelines per node.
- **Frozen branches:** revisiting a node is instant, zero API calls — the write-once cache made tangible.
- Passages capped ~250 words so the *tree* is the experience.

**What the prototype is for:** answering the §4 decision (author vs. explorer) by feel, and pressure-testing whether branching is actually *fun* before further investment.

---

## 10. Defensibility / moat plan

- **Accumulated library + branch trees** — compounding content competitors can't copy via an API call.
- **Reader/author graph** — network effects (deferred but designed-for).
- **Proprietary signal** — which branches get explored/forked most becomes data for ranking, recommendation, and steering quality.
- **Workflow lock-in** — saved trees, handles, shared links create switching cost.
- *Not* a moat: the generation itself. Never market on "we generate" — market on "the atlas you build."

---

## 11. Technical architecture (notes for build)

- **Frontend:** React (prototype already in this stack). Tree layout: tidy-tree algorithm, SVG edges/nodes (as in prototype).
- **Backend/data:** Supabase (founder's existing strength). Schema sketch: `stories`, `nodes` (id, story_id, parent_id, title, summary, content, steer, created_by), `users`. Tree = adjacency list via `parent_id`.
- **Generation:** Claude API. Each branch call receives the **ancestor chain** (summaries + last passage) for coherence. Store `summary` per node to keep context cheap.
- **Caching = persistence:** because passages are immutable once written, the DB *is* the cache. No regeneration on read.
- **BYOK:** store/use user key client-side or via secure edge function; never log keys.
- **Coherence upgrade path (later):** a "story bible"/Codex (characters, world facts) maintained per tree and injected into generation — a natural fit for the founder's **RAG/MCP** experience and a real differentiator vs. naive prompt-chaining. This is the credible deepening of the moat over time.
- **Cost guardrails:** quota checks server-side before any generation call.

---

## 12. Risks & mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| **Two-sided cold start** (empty platform feels dead) | High | Ship single-player first; defer social; seed with founder-made trees; lightweight share links before full network |
| **Reader-triggered generation cost** | High | BYOK + branch quotas + fork rate-limits from v1 |
| **Commoditization / clonability** | Med | Compete on library + graph + coherence engine, not generation |
| **Model/platform dependency** | Med | Model-agnostic generation layer; BYOK reduces exposure |
| **Quality/coherence drift down long paths** | Med | Ancestor-chain context now; story-bible/RAG later |
| **Moderation** (shared UGC + AI output) | Med | Content policy + filtering before any public discovery launches (note: this nearly sank AI Dungeon) |
| **Distribution as the real bottleneck** | High | Community-led GTM + shareable-link loop; treat marketing as the main job, not the code |

---

## 13. Success metrics

- **Activation:** % of new users who create ≥1 branch (i.e., experience the core loop).
- **Core retention signal:** branches created per user per week; return visits to *revisit* existing branches.
- **Tree depth/breadth:** avg branches per story (engagement with the actual differentiator).
- **Share rate:** % of stories shared; visits per shared link; fork-from-share conversion.
- **Economics:** API cost per active user; cache hit ratio (reads served with zero generation).
- **Business:** free→paid conversion; MRR toward the $1–5k band.

---

## 14. Roadmap / phasing

- **Phase 0 — Validate (now):** use the prototype; answer the author-vs-explorer decision (§4).
- **Phase 1 — Single-player MVP:** persistence, auth, tree + branching + steering + frozen cache. Goal: prove the loop is fun and retentive for *you and a handful of testers*.
- **Phase 2 — Lightweight sharing + monetization:** share links, fork-from-share, BYOK/quotas, Pro tier. Goal: first paying users via community GTM.
- **Phase 3 — Social + coherence engine:** discovery, graph features, story-bible/RAG. Goal: network effects + deepened moat → durable MRR and acquirability.

---

## 15. Open questions / decisions to make

1. **Author vs. explorer** (§4) — the scope-defining decision.
2. BYOK-first vs. credits-first for the initial cost model?
3. Passage length: fixed-short, or user-adjustable?
4. How "social" before it's a distraction — links only, or minimal profiles, in v1?
5. Which moment is the *shareable* artifact — a single path, or the whole tree?
6. Moderation threshold before any public/discovery surface ships.
7. Verify small-competitor traction (paid Similarweb/Semrush) before assuming the niche is open.

---

## Appendix — source/confidence notes

Key figures (churn, exit multiples, market size, competitor traction) are drawn from the dedicated research pass: RevenueCat 2026 (retention), Freemius 2025 (micro-SaaS revenue distribution), Mordor Intelligence (market size), GetLatka/Similarweb (competitor traction), US Copyright Office Jan 2025 (AI-text copyrightability), and Amazon KDP policy (2023 upload cap + AI disclosure). Treat forward-looking multiples/CAGRs as estimates, and verify newer small-tool traffic/revenue with a paid analytics lookup before any dependent bet.