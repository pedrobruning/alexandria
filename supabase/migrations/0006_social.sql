-- Social layer — visibility, stars, and forks.
-- Re-scopes the Phase-1 "social out of scope" line for these three features.
-- See SPEC.social.md. RLS SELECT widens to public/unlisted; all writes stay
-- owner-only, so opening reads never opens writes (passages remain immutable
-- and owner-authored).

-- ---------------------------------------------------------------------------
-- stories: visibility + fork attribution
-- ---------------------------------------------------------------------------
alter table public.stories
  add column if not exists visibility text not null default 'private'
    check (visibility in ('private', 'unlisted', 'public')),
  add column if not exists forked_from_story_id uuid
    references public.stories (id) on delete set null;

create index if not exists stories_visibility_idx on public.stories (visibility);

-- Widen SELECT: owners always; anyone for public/unlisted. `unlisted` is
-- readable only by id (possessing the UUID is the link); the browse page
-- filters to `public` in the query, not via RLS. Writes are unchanged.
drop policy if exists "stories_select_own" on public.stories;
create policy "stories_select_visible"
  on public.stories for select
  using (auth.uid() = user_id or visibility in ('public', 'unlisted'));

-- ---------------------------------------------------------------------------
-- nodes: mark fork-copied passages (quota-exempt; they are copies, not
-- generations). Read follows the parent story's visibility; insert is
-- unchanged (still requires story ownership), so reads don't grant writes.
-- ---------------------------------------------------------------------------
alter table public.nodes
  add column if not exists imported boolean not null default false;

drop policy if exists "nodes_select_own" on public.nodes;
create policy "nodes_select_visible"
  on public.nodes for select
  using (
    exists (
      select 1 from public.stories s
      where s.id = nodes.story_id
        and (s.user_id = auth.uid() or s.visibility in ('public', 'unlisted'))
    )
  );

-- ---------------------------------------------------------------------------
-- stars: a user stars a story they can see (not their own). Counts are derived.
-- ---------------------------------------------------------------------------
create table if not exists public.stars (
  user_id    uuid not null references auth.users (id) on delete cascade,
  story_id   uuid not null references public.stories (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, story_id)
);

create index if not exists stars_story_id_idx on public.stars (story_id);

alter table public.stars enable row level security;

create policy "stars_select_visible"
  on public.stars for select
  using (
    exists (
      select 1 from public.stories s
      where s.id = stars.story_id
        and (s.user_id = auth.uid() or s.visibility in ('public', 'unlisted'))
    )
  );

create policy "stars_insert_own"
  on public.stars for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.stories s
      where s.id = story_id
        and s.user_id <> auth.uid()
        and s.visibility in ('public', 'unlisted')
    )
  );

create policy "stars_delete_own"
  on public.stars for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- public_profiles: expose only id + handle for browse author attribution,
-- without widening profiles RLS (which would leak default_model / onboarded_at).
-- A view runs with its definer's privileges, so it bypasses the underlying
-- owner-only RLS — intended here, since id + handle are public display data.
-- ---------------------------------------------------------------------------
create or replace view public.public_profiles as
  select id, handle from public.profiles;

grant select on public.public_profiles to authenticated, anon;
