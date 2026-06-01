import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db.types";

// Ensures a profiles row exists for the signed-in user. Idempotent: safe to
// call on every authenticated request. RLS restricts the upsert to self.
export async function bootstrapProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  await supabase
    .from("profiles")
    .upsert({ id: userId }, { onConflict: "id", ignoreDuplicates: true });
}
