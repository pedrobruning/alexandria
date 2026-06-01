-- Alexandria — Phase 1 MVP schema
-- Story is a tree of immutable passages (adjacency list via nodes.parent_id).
-- The DB is the cache: nodes have no UPDATE policy, so written passages are frozen.

-- ---------------------------------------------------------------------------
-- profiles: 1:1 with auth.users
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  handle        text unique,
  default_model text,
  created_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- stories
-- ---------------------------------------------------------------------------
create table if not exists public.stories (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  title        text not null,
  premise      text not null,
  genre        text,
  tone         text,
  root_node_id uuid,
  created_at   timestamptz not null default now()
);

create index if not exists stories_user_id_idx on public.stories (user_id);

alter table public.stories enable row level security;

create policy "stories_select_own"
  on public.stories for select
  using (auth.uid() = user_id);

create policy "stories_insert_own"
  on public.stories for insert
  with check (auth.uid() = user_id);

create policy "stories_update_own"
  on public.stories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "stories_delete_own"
  on public.stories for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- nodes (passages). Immutable once written: no UPDATE/DELETE policy.
-- Deleting a story cascades to its nodes via the FK (a referential action,
-- not subject to RLS), so explicit delete policies are unnecessary.
-- ---------------------------------------------------------------------------
create table if not exists public.nodes (
  id         uuid primary key default gen_random_uuid(),
  story_id   uuid not null references public.stories (id) on delete cascade,
  parent_id  uuid references public.nodes (id) on delete cascade,
  content    text not null,
  summary    text not null,
  steer      text,
  model_used text not null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists nodes_story_id_idx on public.nodes (story_id);
create index if not exists nodes_parent_id_idx on public.nodes (parent_id);
-- Quota: count a user's server-key branches within a rolling window.
create index if not exists nodes_created_by_created_at_idx
  on public.nodes (created_by, created_at);

-- Nullable FK set after the root node is inserted (story → node → update story).
alter table public.stories
  add constraint stories_root_node_id_fkey
  foreign key (root_node_id) references public.nodes (id) on delete set null;

alter table public.nodes enable row level security;

create policy "nodes_select_own"
  on public.nodes for select
  using (auth.uid() = created_by);

create policy "nodes_insert_own"
  on public.nodes for insert
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.stories s
      where s.id = story_id and s.user_id = auth.uid()
    )
  );
