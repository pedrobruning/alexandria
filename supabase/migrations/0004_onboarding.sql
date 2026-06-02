-- Onboarding: track whether a user has seen the guided tour, and mark the
-- seeded demo story so the reader can render it read-only and the Archive can
-- badge it. `onboarded_at` is null until the user finishes or skips the tour;
-- it gates the first-sign-in auto-start (replay is manual, so it stays set).
-- Demo rows are user-owned like any other, so existing RLS already scopes them.

alter table public.profiles
  add column if not exists onboarded_at timestamptz;

alter table public.stories
  add column if not exists is_demo boolean not null default false;
