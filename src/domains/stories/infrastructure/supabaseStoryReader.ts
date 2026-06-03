import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db.types";
import type { StoryContext } from "@/domains/generation/domain/types";
import type { StoryDetail, StorySummary } from "../domain/types";

// Story context plus the minimal node tree needed to branch from a parent.
// `isDemo` lets the branch route reject writes to the read-only demo story.
export type BranchContext = {
  story: StoryContext;
  ownerId: string;
  isDemo: boolean;
  nodes: { id: string; parentId: string | null; summary: string; content: string }[];
};

// Lists the signed-in user's stories for the Archive, newest first. SELECT RLS
// now also exposes others' public/unlisted stories, so both queries filter to
// the owner explicitly — the Archive shows only the caller's own stories.
export async function listStories(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<StorySummary[]> {
  const { data: stories, error } = await supabase
    .from("stories")
    .select("id, title, genre, tone, created_at, is_demo")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listStories: ${error.message}`);

  const storyIds = (stories ?? []).map((s) => s.id);
  const counts = new Map<string, number>();
  if (storyIds.length > 0) {
    const { data: nodes, error: nodesError } = await supabase
      .from("nodes")
      .select("story_id")
      .in("story_id", storyIds);
    if (nodesError) throw new Error(`listStories: ${nodesError.message}`);
    for (const node of nodes ?? []) {
      counts.set(node.story_id, (counts.get(node.story_id) ?? 0) + 1);
    }
  }

  return (stories ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    genre: s.genre,
    tone: s.tone,
    createdAt: s.created_at,
    passageCount: counts.get(s.id) ?? 0,
    isDemo: s.is_demo,
  }));
}

// Loads one story with its full node tree for the reader. Returns null when the
// story doesn't exist or isn't the caller's (RLS scopes both queries to owner).
export async function getStory(
  supabase: SupabaseClient<Database>,
  storyId: string,
): Promise<StoryDetail | null> {
  const { data: story, error } = await supabase
    .from("stories")
    .select("id, title, root_node_id, is_demo, language")
    .eq("id", storyId)
    .maybeSingle();
  if (error) throw new Error(`getStory: ${error.message}`);
  if (!story) return null;

  const { data: nodes, error: nodesError } = await supabase
    .from("nodes")
    .select("id, parent_id, title, content, summary")
    .eq("story_id", storyId)
    .order("created_at", { ascending: true });
  if (nodesError) throw new Error(`getStory: ${nodesError.message}`);

  return {
    id: story.id,
    title: story.title,
    rootNodeId: story.root_node_id,
    isDemo: story.is_demo,
    language: story.language,
    nodes: (nodes ?? []).map((n) => ({
      id: n.id,
      parentId: n.parent_id,
      title: n.title,
      content: n.content,
      summary: n.summary,
    })),
  };
}

// The user's demo story, if one exists. Demos stay private, but the SELECT
// policy now exposes others' public/unlisted stories, so filter to the owner
// explicitly. Used to avoid reseeding on repeat sign-ins and to resolve the
// redirect target after a language switch.
export async function findDemoStory(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{ storyId: string; rootNodeId: string | null; language: string } | null> {
  const { data, error } = await supabase
    .from("stories")
    .select("id, root_node_id, language")
    .eq("user_id", userId)
    .eq("is_demo", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`findDemoStory: ${error.message}`);
  if (!data) return null;
  return { storyId: data.id, rootNodeId: data.root_node_id, language: data.language };
}

// Loads what's needed to branch from a node: the story's generation context and
// the node tree (summaries + content for ancestor assembly). Returns null when
// the story isn't the caller's (RLS scopes both queries to the owner).
export async function getBranchContext(
  supabase: SupabaseClient<Database>,
  storyId: string,
): Promise<BranchContext | null> {
  const { data: story, error } = await supabase
    .from("stories")
    .select("user_id, premise, genre, tone, language, is_demo")
    .eq("id", storyId)
    .maybeSingle();
  if (error) throw new Error(`getBranchContext: ${error.message}`);
  if (!story) return null;

  const { data: nodes, error: nodesError } = await supabase
    .from("nodes")
    .select("id, parent_id, summary, content")
    .eq("story_id", storyId);
  if (nodesError) throw new Error(`getBranchContext: ${nodesError.message}`);

  return {
    story: {
      premise: story.premise,
      genre: story.genre,
      tone: story.tone,
      language: story.language,
    },
    ownerId: story.user_id,
    isDemo: story.is_demo,
    nodes: (nodes ?? []).map((n) => ({
      id: n.id,
      parentId: n.parent_id,
      summary: n.summary,
      content: n.content,
    })),
  };
}
