import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db.types";
import { windowStart } from "../domain/quota";

// Counts the caller's quota-bearing generations inside the rolling window. The
// `created_by` filter scopes to the caller. Demo nodes (the onboarding story)
// and imported nodes (fork copies, not generations) are excluded so neither
// spends a user's allowance.
export async function countQuotaNodes(
  supabase: SupabaseClient<Database>,
  userId: string,
  now: Date = new Date(),
): Promise<number> {
  const since = windowStart(now).toISOString();

  const { data: demoStories, error: demoError } = await supabase
    .from("stories")
    .select("id")
    .eq("user_id", userId)
    .eq("is_demo", true);
  if (demoError) throw new Error(`countQuotaNodes: ${demoError.message}`);

  let query = supabase
    .from("nodes")
    .select("id", { count: "exact", head: true })
    .eq("created_by", userId)
    .eq("imported", false)
    .gte("created_at", since);

  const demoIds = (demoStories ?? []).map((s) => s.id);
  if (demoIds.length > 0) {
    query = query.not("story_id", "in", `(${demoIds.join(",")})`);
  }

  const { count, error } = await query;
  if (error) throw new Error(`countQuotaNodes: ${error.message}`);
  return count ?? 0;
}
