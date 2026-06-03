import { describe, expect, it } from "vitest";
import { createBranch, type BranchWriter } from "@/domains/stories/application/createBranch";
import type { AncestorContext, GeneratedPassage } from "@/domains/generation/domain/types";
import type { PathNode } from "@/domains/generation/domain/ancestors";

type Calls = { insertBranchNode: Parameters<BranchWriter["insertBranchNode"]>[0][] };

function fakeWriter(): { writer: BranchWriter; calls: Calls } {
  const calls: Calls = { insertBranchNode: [] };
  const writer: BranchWriter = {
    async insertBranchNode(input) {
      calls.insertBranchNode.push(input);
      return { id: "child-1" };
    },
  };
  return { writer, calls };
}

const parentPath: PathNode[] = [
  { summary: "Root summary", content: "Root text" },
  { summary: "Parent summary", content: "Parent text" },
];

const passage: GeneratedPassage = {
  title: "The Refusal",
  content: "She turned the offer down.",
  summary: "The hero refuses.",
};

describe("createBranch", () => {
  it("assembles ancestors, generates, and inserts the child node", async () => {
    const { writer, calls } = fakeWriter();
    let seen: { ancestors: AncestorContext; steer: string | null } | null = null;

    const result = await createBranch({
      storyId: "story-1",
      parentId: "parent-1",
      parentPath,
      userId: "user-1",
      model: "openai/gpt-5.4-nano",
      steer: "but she refuses",
      generate: async (ancestors, steer) => {
        seen = { ancestors, steer };
        return passage;
      },
      writer,
    });

    expect(result).toEqual({ nodeId: "child-1" });

    // Ancestor context handed to generation is derived from the parent path.
    expect(seen!.ancestors).toEqual({
      summaries: ["Root summary", "Parent summary"],
      lastPassage: "Parent text",
    });
    expect(seen!.steer).toBe("but she refuses");

    expect(calls.insertBranchNode).toEqual([
      {
        storyId: "story-1",
        parentId: "parent-1",
        title: passage.title,
        content: passage.content,
        summary: passage.summary,
        steer: "but she refuses",
        modelUsed: "openai/gpt-5.4-nano",
        createdBy: "user-1",
      },
    ]);
  });

  it("persists nothing when generation fails", async () => {
    const { writer, calls } = fakeWriter();

    await expect(
      createBranch({
        storyId: "story-1",
        parentId: "parent-1",
        parentPath,
        userId: "user-1",
        model: "m",
        steer: null,
        generate: async () => {
          throw new Error("generation failed");
        },
        writer,
      }),
    ).rejects.toThrow("generation failed");

    expect(calls.insertBranchNode).toEqual([]);
  });
});
