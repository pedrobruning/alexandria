-- BYOK is removed: every passage now runs on the shared server key, so the
-- per-node used_server_key flag no longer carries information. Quota is counted
-- from non-demo nodes the user created within the rolling window instead.

alter table public.nodes
  drop column if exists used_server_key;
