-- The onboarding demo grants exactly one free, quota-exempt generation so the
-- newcomer feels a branch being born from their own steer — "I wrote a
-- direction, clicked, and another timeline grew." The allowance is a single
-- nullable timestamp on the profile, claimed by a guarded UPDATE (set only
-- where still null) so concurrent forks can't double-spend it. Demo nodes
-- already live on the demo story, which the quota counter excludes, so this
-- gate is the only thing bounding the freebie. Owner-only UPDATE RLS on
-- profiles already covers the claim — no new policy needed.

alter table public.profiles
  add column if not exists demo_branch_used_at timestamptz;
