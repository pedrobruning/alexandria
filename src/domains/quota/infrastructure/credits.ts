import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db.types";

// Reads the caller's spendable one-time bonus credit balance. RLS scopes the
// read to self.
export async function readBonusCredits(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("profiles")
    .select("bonus_credits")
    .eq("id", userId)
    .single();
  if (error) throw new Error(`readBonusCredits: ${error.message}`);
  return data?.bonus_credits ?? 0;
}

// Atomically spends one bonus credit via the spend_bonus_credit RPC, flooring at
// zero. Returns whether a credit was actually consumed (false when the balance
// was already empty — e.g. a concurrent generation took the last one).
export async function consumeCredit(
  supabase: SupabaseClient<Database>,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("spend_bonus_credit");
  if (error) throw new Error(`consumeCredit: ${error.message}`);
  return data === true;
}
