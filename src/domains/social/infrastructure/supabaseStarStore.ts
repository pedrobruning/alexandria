import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db.types";
import type { StarStore } from "../application/toggleStar";

// Supabase-backed StarStore. RLS enforces "visible, non-own story" on insert and
// "own row" on delete, so the request-bound server client must be used.
export function supabaseStarStore(supabase: SupabaseClient<Database>): StarStore {
  return {
    async add(userId, storyId) {
      const { error } = await supabase
        .from("stars")
        .upsert({ user_id: userId, story_id: storyId }, { onConflict: "user_id,story_id" });
      if (error) throw new Error(`star.add: ${error.message}`);
    },

    async remove(userId, storyId) {
      const { error } = await supabase
        .from("stars")
        .delete()
        .eq("user_id", userId)
        .eq("story_id", storyId);
      if (error) throw new Error(`star.remove: ${error.message}`);
    },
  };
}
