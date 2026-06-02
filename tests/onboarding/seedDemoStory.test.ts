import { describe, expect, it } from "vitest";
import {
  seedDemoStory,
  type DemoStoryWriter,
} from "@/domains/stories/application/seedDemoStory";
import { getDemoStory } from "@/domains/onboarding/domain/demoStory";

type Calls = {
  deleteDemoStories: string[];
  insertDemoStory: Parameters<DemoStoryWriter["insertDemoStory"]>[0][];
  insertDemoNode: Parameters<DemoStoryWriter["insertDemoNode"]>[0][];
  setRootNode: { storyId: string; nodeId: string }[];
};

function fakeWriter(): { writer: DemoStoryWriter; calls: Calls } {
  const calls: Calls = {
    deleteDemoStories: [],
    insertDemoStory: [],
    insertDemoNode: [],
    setRootNode: [],
  };
  let n = 0;
  const writer: DemoStoryWriter = {
    async deleteDemoStories(userId) {
      calls.deleteDemoStories.push(userId);
    },
    async insertDemoStory(input) {
      calls.insertDemoStory.push(input);
      return { id: "story-1" };
    },
    async insertDemoNode(input) {
      calls.insertDemoNode.push(input);
      return { id: `node-${++n}` };
    },
    async setRootNode(storyId, nodeId) {
      calls.setRootNode.push({ storyId, nodeId });
    },
  };
  return { writer, calls };
}

describe("seedDemoStory", () => {
  it("inserts the demo story and every node, mapping parent keys to real ids", async () => {
    const { writer, calls } = fakeWriter();
    const demo = getDemoStory("en");

    const result = await seedDemoStory({ userId: "user-1", locale: "en", writer });

    expect(calls.insertDemoStory).toEqual([
      {
        userId: "user-1",
        title: demo.title,
        premise: demo.premise,
        genre: demo.genre,
        tone: demo.tone,
        language: "en",
      },
    ]);

    // one insert per demo node, in tree order, with the root parentId null
    expect(calls.insertDemoNode).toHaveLength(demo.nodes.length);
    expect(calls.insertDemoNode[0].parentId).toBeNull();
    expect(calls.insertDemoNode[0].createdBy).toBe("user-1");

    // a child node points at its parent's freshly-minted id, not the local key
    const northIndex = demo.nodes.findIndex((d) => d.key === "tower");
    const parentIndex = demo.nodes.findIndex((d) => d.key === "north");
    expect(calls.insertDemoNode[northIndex].parentId).toBe(`node-${parentIndex + 1}`);

    // root node id is linked back to the story
    expect(calls.setRootNode).toEqual([{ storyId: "story-1", nodeId: "node-1" }]);
    expect(result).toEqual({ storyId: "story-1", rootNodeId: "node-1" });
  });

  it("seeds in the requested locale", async () => {
    const { writer, calls } = fakeWriter();
    const ptDemo = getDemoStory("pt-BR");

    await seedDemoStory({ userId: "u", locale: "pt-BR", writer });

    expect(calls.insertDemoStory[0].title).toBe(ptDemo.title);
    expect(calls.insertDemoStory[0].language).toBe("pt-BR");
    expect(calls.insertDemoNode[0].content).toBe(ptDemo.nodes[0].content);
  });

  it("does not delete anything on a first seed", async () => {
    const { writer, calls } = fakeWriter();
    await seedDemoStory({ userId: "u", locale: "en", writer });
    expect(calls.deleteDemoStories).toEqual([]);
  });

  it("replace=true deletes the user's existing demo before reseeding", async () => {
    const { writer, calls } = fakeWriter();
    await seedDemoStory({ userId: "u", locale: "en", writer, replace: true });
    expect(calls.deleteDemoStories).toEqual(["u"]);
    expect(calls.insertDemoStory).toHaveLength(1);
  });
});
