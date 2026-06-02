import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db.types";
import type { StoryWriter } from "../application/createStory";
import type { BranchWriter } from "../application/createBranch";

// Supabase-backed StoryWriter. RLS scopes every row to the authenticated user,
// so the client must be the request-bound server client.
export function supabaseStoryWriter(supabase: SupabaseClient<Database>): StoryWriter {
  return {
    async insertStory(input) {
      const { data, error } = await supabase
        .from("stories")
        .insert({
          user_id: input.userId,
          title: input.title,
          premise: input.premise,
          genre: input.genre,
          tone: input.tone,
          language: input.language,
        })
        .select("id")
        .single();
      if (error) throw new Error(`insertStory: ${error.message}`);
      return { id: data.id };
    },

    async insertRootNode(input) {
      const { data, error } = await supabase
        .from("nodes")
        .insert({
          story_id: input.storyId,
          parent_id: null,
          title: input.title,
          content: input.content,
          summary: input.summary,
          model_used: input.modelUsed,
          used_server_key: input.usedServerKey,
          created_by: input.createdBy,
        })
        .select("id")
        .single();
      if (error) throw new Error(`insertRootNode: ${error.message}`);
      return { id: data.id };
    },

    async setRootNode(storyId, nodeId) {
      const { error } = await supabase
        .from("stories")
        .update({ root_node_id: nodeId })
        .eq("id", storyId);
      if (error) throw new Error(`setRootNode: ${error.message}`);
    },
  };
}

// Supabase-backed BranchWriter. RLS scopes the insert to the authenticated user.
export function supabaseBranchWriter(supabase: SupabaseClient<Database>): BranchWriter {
  return {
    async insertBranchNode(input) {
      const { data, error } = await supabase
        .from("nodes")
        .insert({
          story_id: input.storyId,
          parent_id: input.parentId,
          title: input.title,
          content: input.content,
          summary: input.summary,
          steer: input.steer,
          model_used: input.modelUsed,
          used_server_key: input.usedServerKey,
          created_by: input.createdBy,
        })
        .select("id")
        .single();
      if (error) throw new Error(`insertBranchNode: ${error.message}`);
      return { id: data.id };
    },
  };
}
