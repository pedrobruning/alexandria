import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db.types";
import type { StorySummary } from "../domain/types";

// Lists the signed-in user's stories for the Archive, newest first. RLS scopes
// both queries to the owner, so node counts only ever cover their own stories.
export async function listStories(supabase: SupabaseClient<Database>): Promise<StorySummary[]> {
  const { data: stories, error } = await supabase
    .from("stories")
    .select("id, title, genre, tone, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listStories: ${error.message}`);

  const { data: nodes, error: nodesError } = await supabase.from("nodes").select("story_id");
  if (nodesError) throw new Error(`listStories: ${nodesError.message}`);

  const counts = new Map<string, number>();
  for (const node of nodes ?? []) {
    counts.set(node.story_id, (counts.get(node.story_id) ?? 0) + 1);
  }

  return (stories ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    genre: s.genre,
    tone: s.tone,
    createdAt: s.created_at,
    passageCount: counts.get(s.id) ?? 0,
  }));
}
