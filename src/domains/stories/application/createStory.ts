import type { GeneratedPassage, StoryContext } from "@/domains/generation/domain/types";

// What the application layer needs from persistence to create a story. The
// Supabase adapter lives in infrastructure; tests can supply a fake.
export type StoryWriter = {
  insertStory(input: {
    userId: string;
    title: string;
    premise: string;
    genre: string | null;
    tone: string | null;
    language: string;
  }): Promise<{ id: string }>;
  insertRootNode(input: {
    storyId: string;
    title: string;
    content: string;
    summary: string;
    modelUsed: string;
    createdBy: string;
  }): Promise<{ id: string }>;
  setRootNode(storyId: string, nodeId: string): Promise<void>;
};

export type CreateStoryInput = {
  story: StoryContext;
  userId: string;
  model: string;
  generate: () => Promise<GeneratedPassage>;
  writer: StoryWriter;
};

export type CreateStoryResult = { storyId: string; rootNodeId: string };

// Generate the opening passage, persist the story and its frozen root node, and
// link the two. The generated passage title doubles as the story's title.
export async function createStory(input: CreateStoryInput): Promise<CreateStoryResult> {
  const passage = await input.generate();

  const { id: storyId } = await input.writer.insertStory({
    userId: input.userId,
    title: passage.title,
    premise: input.story.premise,
    genre: input.story.genre,
    tone: input.story.tone,
    language: input.story.language,
  });

  const { id: rootNodeId } = await input.writer.insertRootNode({
    storyId,
    title: passage.title,
    content: passage.content,
    summary: passage.summary,
    modelUsed: input.model,
    createdBy: input.userId,
  });

  await input.writer.setRootNode(storyId, rootNodeId);

  return { storyId, rootNodeId };
}
