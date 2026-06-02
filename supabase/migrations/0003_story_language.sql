-- The language every passage in a story is generated in (BCP-47-ish code, e.g.
-- 'en' or 'pt-BR'). Branches inherit the story's language so a tale stays in
-- one tongue across its whole tree.

alter table public.stories
  add column if not exists language text not null default 'en';
