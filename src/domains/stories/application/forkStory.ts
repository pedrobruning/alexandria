import { remapTree, orderForInsert, type SourceNode } from "../domain/fork";

// The source story to copy: its sharing-independent fields plus the full node
// tree (with steer + model so copies are faithful).
export type ForkSource = {
  storyId: string;
  ownerId: string;
  title: string;
  premise: string;
  genre: string | null;
  tone: string | null;
  language: string;
  nodes: SourceNode[];
};

// Persistence port for a fork. Copied nodes are inserted with imported=true so
// they never count against quota (they are copies, not generations).
export type ForkWriter = {
  insertStory(input: {
    userId: string;
    title: string;
    premise: string;
    genre: string | null;
    tone: string | null;
    language: string;
    forkedFromStoryId: string;
  }): Promise<{ id: string }>;
  insertNodes(
    storyId: string,
    createdBy: string,
    nodes: SourceNode[],
  ): Promise<void>;
  setRootNode(storyId: string, nodeId: string): Promise<void>;
};

export class SelfForkError extends Error {
  constructor() {
    super("a user cannot fork their own story");
    this.name = "SelfForkError";
  }
}

export type ForkStoryInput = {
  userId: string;
  source: ForkSource;
  genId: () => string;
  writer: ForkWriter;
};

// Copy a story into a new private one owned by the caller. The tree is remapped
// to fresh ids and inserted parent-first; the frozen prose is copied verbatim.
export async function forkStory(input: ForkStoryInput): Promise<{ storyId: string }> {
  const { userId, source, genId, writer } = input;
  if (source.ownerId === userId) throw new SelfForkError();

  const { nodes: remapped, rootId } = remapTree(source.nodes, genId);
  const ordered = orderForInsert(remapped);

  const { id: storyId } = await writer.insertStory({
    userId,
    title: source.title,
    premise: source.premise,
    genre: source.genre,
    tone: source.tone,
    language: source.language,
    forkedFromStoryId: source.storyId,
  });

  await writer.insertNodes(storyId, userId, ordered);

  if (rootId) {
    await writer.setRootNode(storyId, rootId);
  }

  return { storyId };
}
