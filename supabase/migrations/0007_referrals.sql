-- Referral / invitation flow.
-- A user shares a personal code (profiles.referral_code). A new signup through it is
-- attributed once (profiles.invited_by + a referrals row). When the invitee writes
-- their 10th qualifying passage, the inviter earns 10 one-time bonus credits
-- (profiles.bonus_credits), capped at 5 rewarded invitees. The cross-user credit write
-- happens ONLY inside SECURITY DEFINER routines — request routes never write another
-- user's row, preserving the owner-only RLS invariant.
--
-- Constants are inlined (Postgres has no cheap module constants); they mirror the pure
-- domain constants in src/domains/referrals/domain/referrals.ts:
--   qualify threshold = 10 nodes · reward = 10 credits · cap = 5 rewarded referrals.

-- ---------------------------------------------------------------------------
-- profiles: personal code, single attribution, one-time bonus credit pool
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists referral_code text unique,
  add column if not exists invited_by uuid references auth.users (id) on delete set null,
  add column if not exists bonus_credits integer not null default 0
    check (bonus_credits >= 0);

-- ---------------------------------------------------------------------------
-- referrals: one row per invitee (PK ⇒ a user is attributed at most once).
-- status latches pending → rewarded (credit granted) or capped (threshold met but
-- the inviter is already at the cap). Rows are mutated only by the routines below;
-- users may read their own (as either party) but never write.
-- ---------------------------------------------------------------------------
create table if not exists public.referrals (
  invitee_id   uuid primary key references auth.users (id) on delete cascade,
  referrer_id  uuid not null references auth.users (id) on delete cascade,
  status       text not null default 'pending'
    check (status in ('pending', 'rewarded', 'capped')),
  qualified_at timestamptz,
  created_at   timestamptz not null default now(),
  constraint referrals_no_self_referral check (referrer_id <> invitee_id)
);

create index if not exists referrals_referrer_id_idx on public.referrals (referrer_id);

alter table public.referrals enable row level security;

create policy "referrals_select_party"
  on public.referrals for select
  using (auth.uid() = referrer_id or auth.uid() = invitee_id);

-- ---------------------------------------------------------------------------
-- claim_referral: called from the auth callback once a session exists. Attributes
-- the signed-in caller (the invitee) to the code's owner, exactly once. Idempotent.
-- SECURITY DEFINER so it can insert the referral and set invited_by; it derives the
-- referrer from the trusted code, never from client input, and blocks self-referral.
-- ---------------------------------------------------------------------------
create or replace function public.claim_referral(p_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitee  uuid := auth.uid();
  v_referrer uuid;
begin
  if v_invitee is null or p_code is null then
    return;
  end if;

  select id into v_referrer
  from public.profiles
  where referral_code = p_code;

  -- Unknown code, or self-referral: nothing to attribute.
  if v_referrer is null or v_referrer = v_invitee then
    return;
  end if;

  -- Already attributed (single-attribution invariant): leave it untouched.
  if exists (select 1 from public.referrals where invitee_id = v_invitee) then
    return;
  end if;

  insert into public.referrals (invitee_id, referrer_id, status)
  values (v_invitee, v_referrer, 'pending')
  on conflict (invitee_id) do nothing;

  update public.profiles
  set invited_by = v_referrer
  where id = v_invitee and invited_by is null;
end;
$$;

revoke all on function public.claim_referral(text) from public;
grant execute on function public.claim_referral(text) to authenticated;

-- ---------------------------------------------------------------------------
-- award_referral_credit: AFTER INSERT trigger on nodes. Ordered for early exit —
-- a single PK probe on referrals returns immediately for the ~99% of inserts whose
-- author has no pending referral, so the lifetime count runs only for an invited
-- user's first ≤10 qualifying nodes (served by nodes(created_by, created_at)).
-- SECURITY DEFINER so it may credit the *inviter's* profile row, which owner-only
-- RLS would otherwise forbid. The latch UPDATE guarantees exactly-once.
-- ---------------------------------------------------------------------------
create or replace function public.award_referral_credit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_referrer       uuid;
  v_node_count     integer;
  v_rewarded_count integer;
  v_new_status     text;
begin
  -- Fast path: only a still-pending invitee can earn anything.
  select referrer_id into v_referrer
  from public.referrals
  where invitee_id = new.created_by and status = 'pending';

  if v_referrer is null then
    return new;
  end if;

  -- Fork copies and demo passages are not generations; they don't count.
  if new.imported then
    return new;
  end if;
  if exists (select 1 from public.stories s where s.id = new.story_id and s.is_demo) then
    return new;
  end if;

  select count(*) into v_node_count
  from public.nodes n
  join public.stories s on s.id = n.story_id
  where n.created_by = new.created_by
    and n.imported = false
    and s.is_demo = false;

  if v_node_count < 10 then
    return new;
  end if;

  -- Threshold met: reward unless the inviter is already at the cap.
  select count(*) into v_rewarded_count
  from public.referrals
  where referrer_id = v_referrer and status = 'rewarded';

  v_new_status := case when v_rewarded_count < 5 then 'rewarded' else 'capped' end;

  update public.referrals
  set status = v_new_status, qualified_at = now()
  where invitee_id = new.created_by and status = 'pending';

  -- Lost the race to another concurrent insert that already latched it.
  if not found then
    return new;
  end if;

  if v_new_status = 'rewarded' then
    update public.profiles
    set bonus_credits = bonus_credits + 10
    where id = v_referrer;
  end if;

  return new;
end;
$$;

drop trigger if exists nodes_award_referral_credit on public.nodes;
create trigger nodes_award_referral_credit
  after insert on public.nodes
  for each row
  execute function public.award_referral_credit();
