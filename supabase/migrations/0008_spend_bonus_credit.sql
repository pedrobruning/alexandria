-- Atomic spend of one bonus credit. supabase-js cannot express a column-relative
-- update (bonus_credits = bonus_credits - 1), so the decrement lives here as a
-- single guarded statement that floors at zero and reports whether it spent.
-- SECURITY INVOKER: it runs as the caller, and the owner-only UPDATE RLS on
-- profiles already permits a user to write their own row — no elevated privilege.
create or replace function public.spend_bonus_credit()
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.profiles
  set bonus_credits = bonus_credits - 1
  where id = auth.uid() and bonus_credits > 0;
  return found;
end;
$$;

revoke all on function public.spend_bonus_credit() from public;
grant execute on function public.spend_bonus_credit() to authenticated;
