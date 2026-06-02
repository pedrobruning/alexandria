-- Add a short chapter title to each passage (used in breadcrumbs, branch rows,
-- and atlas node labels) and a flag marking whether a generation spent the
-- shared server key (BYOK generations do not count against the user's quota).

alter table public.nodes
  add column if not exists title text not null default 'Untitled',
  add column if not exists used_server_key boolean not null default true;
