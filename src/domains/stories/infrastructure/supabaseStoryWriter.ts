import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db.types";
import type { StoryWriter } from "../application/createStory";
import type { BranchWriter } from "../application/createBranch";
import type { DemoStoryWriter } from "../application/seedDemoStory";
import type { ForkWriter } from "../application/forkStory";

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
          created_by: input.createdBy,
        })
        .select("id")
        .single();
      if (error) throw new Error(`insertBranchNode: ${error.message}`);
      return { id: data.id };
    },
  };
}

// Supabase-backed DemoStoryWriter for onboarding. Demo nodes carry a sentinel
// `model_used` since no model produced them, and the quota counter excludes
// demo stories so they never spend a user's allowance. Re-seeding (language
// switch) deletes the user's demo story; nodes cascade via the FK because
// `nodes` has no DELETE policy by design (immutability). RLS scopes every row.
export function supabaseDemoWriter(supabase: SupabaseClient<Database>): DemoStoryWriter {
  return {
    async deleteDemoStories(userId) {
      const { error } = await supabase
        .from("stories")
        .delete()
        .eq("user_id", userId)
        .eq("is_demo", true);
      if (error) throw new Error(`deleteDemoStories: ${error.message}`);
    },

    async insertDemoStory(input) {
      const { data, error } = await supabase
        .from("stories")
        .insert({
          user_id: input.userId,
          title: input.title,
          premise: input.premise,
          genre: input.genre,
          tone: input.tone,
          language: input.language,
          is_demo: true,
        })
        .select("id")
        .single();
      if (error) throw new Error(`insertDemoStory: ${error.message}`);
      return { id: data.id };
    },

    async insertDemoNode(input) {
      const { data, error } = await supabase
        .from("nodes")
        .insert({
          story_id: input.storyId,
          parent_id: input.parentId,
          title: input.title,
          content: input.content,
          summary: input.summary,
          steer: input.steer,
          model_used: "demo",
          created_by: input.createdBy,
        })
        .select("id")
        .single();
      if (error) throw new Error(`insertDemoNode: ${error.message}`);
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

// Supabase-backed ForkWriter. The new story is owned by the forker (RLS scopes
// the insert) and starts private; copied nodes carry explicit remapped ids
// (preserving the tree), imported=true (quota-exempt), and created_by=forker so
// the nodes insert policy passes. Nodes must arrive parent-first.
export function supabaseForkWriter(supabase: SupabaseClient<Database>): ForkWriter {
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
          visibility: "private",
          forked_from_story_id: input.forkedFromStoryId,
        })
        .select("id")
        .single();
      if (error) throw new Error(`fork.insertStory: ${error.message}`);
      return { id: data.id };
    },

    async insertNodes(storyId, createdBy, nodes) {
      if (nodes.length === 0) return;
      const rows = nodes.map((n) => ({
        id: n.id,
        story_id: storyId,
        parent_id: n.parentId,
        title: n.title,
        content: n.content,
        summary: n.summary,
        steer: n.steer,
        model_used: n.modelUsed,
        created_by: createdBy,
        imported: true,
      }));
      const { error } = await supabase.from("nodes").insert(rows);
      if (error) throw new Error(`fork.insertNodes: ${error.message}`);
    },

    async setRootNode(storyId, nodeId) {
      const { error } = await supabase
        .from("stories")
        .update({ root_node_id: nodeId })
        .eq("id", storyId);
      if (error) throw new Error(`fork.setRootNode: ${error.message}`);
    },
  };
}
