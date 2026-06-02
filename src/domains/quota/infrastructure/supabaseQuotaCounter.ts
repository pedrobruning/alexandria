import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db.types";
import { windowStart } from "../domain/quota";

// Counts the caller's server-key generations inside the rolling quota window.
// RLS scopes rows to the owner, so this only ever counts the user's own nodes.
export async function countServerKeyNodes(
  supabase: SupabaseClient<Database>,
  userId: string,
  now: Date = new Date(),
): Promise<number> {
  const since = windowStart(now).toISOString();
  const { count, error } = await supabase
    .from("nodes")
    .select("id", { count: "exact", head: true })
    .eq("created_by", userId)
    .eq("used_server_key", true)
    .gte("created_at", since);
  if (error) throw new Error(`countServerKeyNodes: ${error.message}`);
  return count ?? 0;
}
