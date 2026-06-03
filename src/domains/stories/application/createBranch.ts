import { assembleAncestors, type PathNode } from "@/domains/generation/domain/ancestors";
import type { AncestorContext, GeneratedPassage } from "@/domains/generation/domain/types";

// What the application layer needs to persist a branch. The Supabase adapter
// lives in infrastructure; tests supply a fake.
export type BranchWriter = {
  insertBranchNode(input: {
    storyId: string;
    parentId: string;
    title: string;
    content: string;
    summary: string;
    steer: string | null;
    modelUsed: string;
    createdBy: string;
  }): Promise<{ id: string }>;
};

export type CreateBranchInput = {
  storyId: string;
  parentId: string;
  // Root→parent path (inclusive), used to build the generation context.
  parentPath: PathNode[];
  userId: string;
  model: string;
  steer: string | null;
  generate: (ancestors: AncestorContext, steer: string | null) => Promise<GeneratedPassage>;
  writer: BranchWriter;
};

export type CreateBranchResult = { nodeId: string };

// Assemble ancestor context from the parent path, generate the next passage,
// and persist it as a frozen child node. Nothing persists if generation throws.
export async function createBranch(input: CreateBranchInput): Promise<CreateBranchResult> {
  const ancestors = assembleAncestors(input.parentPath);
  const passage = await input.generate(ancestors, input.steer);

  const { id } = await input.writer.insertBranchNode({
    storyId: input.storyId,
    parentId: input.parentId,
    title: passage.title,
    content: passage.content,
    summary: passage.summary,
    steer: input.steer,
    modelUsed: input.model,
    createdBy: input.userId,
  });

  return { nodeId: id };
}
