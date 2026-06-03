import { describe, it, expect, vi } from "vitest";
import { forkStory, SelfForkError, type ForkSource, type ForkWriter } from "@/domains/stories/application/forkStory";
import type { SourceNode } from "@/domains/stories/domain/fork";

const nodes: SourceNode[] = [
  { id: "r", parentId: null, title: "Root", content: "c0", summary: "s0", steer: null, modelUsed: "m" },
  { id: "a", parentId: "r", title: "A", content: "c1", summary: "s1", steer: null, modelUsed: "m" },
];

const source: ForkSource = {
  storyId: "src",
  ownerId: "owner",
  title: "Tale",
  premise: "p",
  genre: "g",
  tone: "t",
  language: "en",
  nodes,
};

function counter() {
  let n = 0;
  return () => `new-${++n}`;
}

function fakeWriter() {
  return {
    insertStory: vi.fn().mockResolvedValue({ id: "fork-1" }),
    insertNodes: vi.fn().mockResolvedValue(undefined),
    setRootNode: vi.fn().mockResolvedValue(undefined),
  } satisfies ForkWriter;
}

describe("forkStory", () => {
  it("creates a private copy attributed to the source and sets the remapped root", async () => {
    const writer = fakeWriter();
    const result = await forkStory({ userId: "viewer", source, genId: counter(), writer });

    expect(result.storyId).toBe("fork-1");
    expect(writer.insertStory).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "viewer", forkedFromStoryId: "src", title: "Tale" }),
    );
    // root inserted first, parent-before-child
    const [, createdBy, ordered] = writer.insertNodes.mock.calls[0];
    expect(createdBy).toBe("viewer");
    expect(ordered[0].parentId).toBeNull();
    expect(writer.setRootNode).toHaveBeenCalledWith("fork-1", ordered[0].id);
  });

  it("rejects forking your own story before any write", async () => {
    const writer = fakeWriter();
    await expect(
      forkStory({ userId: "owner", source, genId: counter(), writer }),
    ).rejects.toBeInstanceOf(SelfForkError);
    expect(writer.insertStory).not.toHaveBeenCalled();
  });
});
