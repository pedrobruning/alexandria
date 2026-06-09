import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db.types";

// The onboarding demo grants exactly one free, quota-exempt generation. The
// allowance is a single timestamp on the caller's profile. Claiming it is a
// guarded UPDATE — set only where still null — so two concurrent demo forks
// can never both succeed. RLS scopes every statement to self.
export async function claimDemoFork(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .update({ demo_branch_used_at: new Date().toISOString() })
    .eq("id", userId)
    .is("demo_branch_used_at", null)
    .select("id");
  if (error) throw new Error(`claimDemoFork: ${error.message}`);
  return (data?.length ?? 0) > 0;
}

// Hand the freebie back when a claimed generation fails before any node is
// written, so the newcomer isn't charged for a passage they never received.
export async function releaseDemoFork(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ demo_branch_used_at: null })
    .eq("id", userId);
  if (error) throw new Error(`releaseDemoFork: ${error.message}`);
}

// Whether the caller has already spent their one demo fork.
export async function readDemoForkUsed(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("demo_branch_used_at")
    .eq("id", userId)
    .single();
  if (error) throw new Error(`readDemoForkUsed: ${error.message}`);
  return data?.demo_branch_used_at != null;
}
