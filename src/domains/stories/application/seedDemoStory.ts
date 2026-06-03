import { getDemoStory } from "@/domains/onboarding/domain/demoStory";

// Persistence needed to seed the onboarding demo. The Supabase adapter
// (`supabaseDemoWriter`) hardcodes the demo's `model_used`; demo stories are
// excluded from the quota count, so the use case stays unaware of that.
export type DemoStoryWriter = {
  deleteDemoStories(userId: string): Promise<void>;
  insertDemoStory(input: {
    userId: string;
    title: string;
    premise: string;
    genre: string;
    tone: string;
    language: string;
  }): Promise<{ id: string }>;
  insertDemoNode(input: {
    storyId: string;
    parentId: string | null;
    title: string;
    content: string;
    summary: string;
    steer: string | null;
    createdBy: string;
  }): Promise<{ id: string }>;
  setRootNode(storyId: string, nodeId: string): Promise<void>;
};

export type SeedDemoStoryInput = {
  userId: string;
  locale: string;
  writer: DemoStoryWriter;
  replace?: boolean; // language switch: drop the existing demo first, then reseed
};

export type SeedDemoStoryResult = { storyId: string; rootNodeId: string };

// Seed the canned demo story for a user. No model call — content is fixed. The
// canned tree lists parents before children, so each parent's real id is known
// by the time its children are inserted.
export async function seedDemoStory(input: SeedDemoStoryInput): Promise<SeedDemoStoryResult> {
  if (input.replace) {
    await input.writer.deleteDemoStories(input.userId);
  }

  const demo = getDemoStory(input.locale);

  const { id: storyId } = await input.writer.insertDemoStory({
    userId: input.userId,
    title: demo.title,
    premise: demo.premise,
    genre: demo.genre,
    tone: demo.tone,
    language: input.locale,
  });

  const idByKey = new Map<string, string>();
  let rootNodeId = "";

  for (const node of demo.nodes) {
    const parentId = node.parentKey ? idByKey.get(node.parentKey)! : null;
    const { id } = await input.writer.insertDemoNode({
      storyId,
      parentId,
      title: node.title,
      content: node.content,
      summary: node.summary,
      steer: node.steer ?? null,
      createdBy: input.userId,
    });
    idByKey.set(node.key, id);
    if (node.parentKey === null) rootNodeId = id;
  }

  await input.writer.setRootNode(storyId, rootNodeId);

  return { storyId, rootNodeId };
}
