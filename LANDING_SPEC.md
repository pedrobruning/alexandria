# Spec: Alexandria — Marketing Landing Page

> Companion to `SPEC.md` (the app) and `PLAN.md` (build status). This spec covers the
> **public landing page** that converts a signed-out visitor into a signed-in user.
> **Status:** Draft — awaiting review before Plan phase.

## Objective

Build a public, scroll-through marketing landing page at `/` that makes a first-time
visitor *want to join Alexandria*. It must communicate the one idea that makes the product
different — **a story is a tree, not a line** — and drive a single action: start writing.

- **Who it's for:** signed-out visitors arriving cold (community links, Product Hunt, word of
  mouth) — the hobbyist reader-writer persona from `PRD.md` §4 (the AI-Dungeon / AO3 / Wattpad
  crowd who enjoy "what if" exploration), *not* professional novelists.
- **The job:** in one screen-height, land the hook; in the scroll, prove the loop is fun and
  the revisit-is-free promise is real; at every section, offer the same CTA.
- **Conversion goal:** click-through to `/login` (magic-link). One primary CTA, repeated.
- **Out of scope:** pricing tables, testimonials, blog, social proof counters, sign-up forms
  on-page (CTA routes to existing `/login`), analytics/tracking wiring, SEO beyond basic
  metadata. Sharing/social framing stays out (Phase 1 is single-player per `SPEC.md`).

### Success looks like

A visitor lands, immediately understands "I create a story and fork it into parallel
timelines," scrolls through how it works and why it's different, and clicks "Begin" — on a
phone or a desktop, in English or Brazilian Portuguese — with no horizontal overflow and no
generic-AI-app feel. It looks like it belongs to the same world as the app.

## Tech Stack

No new dependencies. Same stack as the app:

- **Next.js 16 App Router + TypeScript.** The page is a **Server Component** by default;
  only the animated hero backdrop / scroll-reveal bits are `"use client"`.
- **Tailwind v4 + the pixel design system** already in `src/app/globals.css` (`frame`, `btn`,
  `chip`, `tag`, `h1`, `h2`, `prose`, `caption`, `fret`, `vignette`, `bg-dune`, `seal`, theme
  tokens `--gold`, `--basalt`, `--sand-light`, `--lapis-bright`, etc.). Prefer Tailwind
  utilities for layout/spacing; reuse the hand-authored pixel classes for chrome.
- **next-intl** for all copy, cookie-based locale (en + pt-BR), matching the app.
- **Reuse, don't reinvent:** `components/pixel/Wordmark`, `components/pixel/PixelIcon`,
  `components/atlas/AtlasSky` (starfield backdrop), `components/i18n/LocaleSwitcher`.

## Commands

Unchanged from `SPEC.md`. The gate before committing a slice:

```
npm test && npm run typecheck && npm run lint && npm run build
```

Manual: `npm run dev` → open `http://localhost:3000` signed-out; verify at ~390px and desktop,
in both locales.

## Project Structure

```
src/
  app/
    page.tsx                         → was a redirect; becomes the landing page.
                                       Server component: if a session exists → redirect("/stories"),
                                       else render <Landing/>. Keeps the auth gate intact.
  components/
    landing/                         → NEW feature folder (INTERFACE/UI layer)
      Landing.tsx                      composes the sections in order; top-level layout/<main>
      Hero.tsx                         full-viewport hero: backdrop + wordmark + hook + CTA
      HeroBackdrop.tsx   ("use client") animated pixel backdrop (see Open Questions / port note)
      TreeNotLine.tsx                  the "a story is a tree, not a line" explainer + visual
      HowItWorks.tsx                   create → read → steer-fork → revisit, as ordered steps
      WhyDifferent.tsx                 the moat/economics in human terms (revisit is free, etc.)
      Faq.tsx                          a few honest Q&As (early access, BYOK, what it is/isn't)
      LandingFooter.tsx                wordmark, final CTA, locale switcher, minimal links
      Reveal.tsx         ("use client") small scroll-reveal wrapper (IntersectionObserver)
  app/globals.css                    → add ONLY landing-specific classes if a utility won't do
                                       (e.g. a hero backdrop keyframe). Reuse existing chrome.
messages/
  en.json, pt-BR.json                → NEW "landing" namespace with all section copy
tests/
  landing/                           → unit tests for any pure helper (see Testing Strategy)
```

Naming: `PascalCase.tsx` components, `landing` namespace in messages, copy keys in
`camelCase` (e.g. `landing.hero.cta`).

## Sections (content outline)

Ordered top → bottom. Every section is full-width, mobile-first, and carries the CTA where
noted.

1. **Hero** — animated pixel backdrop (reuse/port), `Wordmark`, the hook line
   *"Every story is a map of the stories it could have been,"* a one-line subhead naming the
   action (create → fork → explore), and the primary CTA **"Begin"** → `/login`. Locale
   switcher present (top-right or footer). This is the only full-viewport section.
2. **Tree, not a line** — the core concept. Short prose + a simple, decorative branching-tree
   visual (SVG or pixel blocks; *static/decorative*, not the live Atlas) showing one passage
   forking into coexisting timelines.
3. **How it works** — four numbered steps mirroring the real loop: *Spark a premise → Read a
   ~250-word passage → Steer a fork → Revisit any timeline, instantly.* Plain language, pixel
   `seal`/`PixelIcon` accents.
4. **Why it's different** — translate the moat/economics (`PRD.md` §3, §7) into reader
   benefits: written passages are **frozen** so revisiting is instant and free; bring your own
   model (BYOK) or use the included quota; it's a library you build, not a thing you generate
   and discard. No jargon, no metrics dashboards.
5. **FAQ** — 3–5 honest entries: "Is this public yet?" (early access, founder + testers),
   "Do I need an API key?" (BYOK optional, quota included), "What languages?" (write in English
   or Brazilian Portuguese), "What happened to one-shot books?" (we branch instead).
6. **Footer / final CTA** — `Wordmark`, a repeat **"Begin"** CTA, `LocaleSwitcher`, and a
   tagline. No social links (none exist in this phase).

## Code Style

Server component page; client only where interaction demands it. Example:

```tsx
// src/app/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Landing } from "@/components/landing/Landing";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/stories");
  return <Landing />;
}
```

```tsx
// src/components/landing/Hero.tsx  (server component; backdrop is the only client child)
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Wordmark } from "@/components/pixel/Wordmark";
import { HeroBackdrop } from "./HeroBackdrop";

export async function Hero() {
  const t = await getTranslations("landing.hero");
  return (
    <section className="screen vignette relative grid place-items-center">
      <HeroBackdrop />
      <div className="relative z-10 text-center px-4">
        <Wordmark size={52} light />
        <p className="prose mt-6 italic max-w-[30ch] mx-auto">{t("hook")}</p>
        <Link href="/login" className="btn btn--lg mt-8 inline-block">{t("cta")}</Link>
      </div>
    </section>
  );
}
```

- All visible strings via `getTranslations` (server) / `useTranslations` (client). No hardcoded
  copy. Add every key to **both** `messages/en.json` and `messages/pt-BR.json`.
- Tailwind utilities for layout/spacing/responsive; pixel classes for chrome. Avoid inline
  `style={{…}}` except for dynamic values (e.g. animation transforms).
- No `any`. Functional components. `"use client"` only on `HeroBackdrop` and `Reveal`.

## Testing Strategy

UI is verified in the browser, not asserted in unit tests (per `CLAUDE.md`). So:

- **Unit (Vitest):** only pure helpers earn a test — e.g. the deterministic tree-visual point
  generator in `TreeNotLine`, or any scroll-reveal stagger math. Mirror under `tests/landing/`.
- **i18n guard:** a test (or reuse an existing message-parity check if one exists) asserting
  the `landing` namespace has the same key set in `en.json` and `pt-BR.json`.
- **Manual (required before "done"):**
  - Signed-out `/` renders the landing page; **signed-in** `/` redirects to `/stories`.
  - Every CTA routes to `/login`.
  - No horizontal overflow at 360px and 390px; sections stack and remain readable.
  - Locale switch flips all landing copy (en ↔ pt-BR) and persists across reload.
  - `prefers-reduced-motion` is respected by hero/scroll animations.
- **Gate:** `npm test && npm run typecheck && npm run lint && npm run build` all green.

## Boundaries

- **Always:** keep the signed-in→`/stories` redirect; route all copy through next-intl in both
  locales; mobile-first (~390px, no horizontal overflow); reuse existing pixel classes and
  components; server components unless interactivity is required.
- **Ask first:** adding any dependency (animation libs, icon packs — none expected); changing
  the auth/redirect behavior; introducing a real on-page sign-up form (currently CTA → `/login`);
  changing the hook/positioning copy's meaning.
- **Never:** add tracking/analytics scripts; build sharing/social/pricing surfaces (out of
  phase); hardcode user-facing strings; touch the app domains (`domains/*`), routes, or DB;
  break the signed-in redirect (don't show marketing to authenticated users).

## Success Criteria

1. Signed-out visitor at `/` sees a full marketing page (hero → tree-not-a-line → how it works
   → why different → FAQ → footer); signed-in visitor at `/` is redirected to `/stories`.
2. The hero communicates "a story is a tree you fork into timelines" within one viewport, and a
   **"Begin"** CTA routes to `/login`; the CTA repeats in the footer.
3. Fully usable on a ~390px phone with **no horizontal overflow**; sections stack cleanly and
   tap targets stay comfortable.
4. All copy renders in **both** en and pt-BR via next-intl; switching locale updates every
   landing string and persists across reload.
5. Visual language is consistent with the app's pixel "Library of Alexandria" theme — reuses
   `Wordmark`, pixel chrome, and the desert/starfield motif; does not look like a generic AI
   landing page.
6. Animations respect `prefers-reduced-motion`.
7. `npm test && npm run typecheck && npm run lint && npm run build` all pass.

## Resolved Decisions

1. **Hero backdrop:** reuse the existing in-app `AtlasSky` starfield plus a decorative
   branching-tree overlay. Do **not** port the design bundle's `PixelPanorama`.
2. **Beta framing + BYOK:** the product is positioned as **public beta / early access** (founder
   + testers, anyone can join). The FAQ may openly mention BYOK as an option.
3. **Headline:** write a punchier headline than the design bundle's
   *"Every story is a map of the stories it could have been"* (which can survive as a subhead
   or supporting line). Draft 2–3 options in the Plan phase for selection.
4. **Metadata/OG:** add basic `<title>`, description, and Open Graph tags now — every shared
   link is a growth surface.
```
