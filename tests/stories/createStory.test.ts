import { describe, expect, it } from "vitest";
import { createStory, type StoryWriter } from "@/domains/stories/application/createStory";
import type { GeneratedPassage, StoryContext } from "@/domains/generation/domain/types";

type Calls = {
  insertStory: Parameters<StoryWriter["insertStory"]>[0][];
  insertRootNode: Parameters<StoryWriter["insertRootNode"]>[0][];
  setRootNode: { storyId: string; nodeId: string }[];
};

function fakeWriter(): { writer: StoryWriter; calls: Calls } {
  const calls: Calls = { insertStory: [], insertRootNode: [], setRootNode: [] };
  const writer: StoryWriter = {
    async insertStory(input) {
      calls.insertStory.push(input);
      return { id: "story-1" };
    },
    async insertRootNode(input) {
      calls.insertRootNode.push(input);
      return { id: "node-1" };
    },
    async setRootNode(storyId, nodeId) {
      calls.setRootNode.push({ storyId, nodeId });
    },
  };
  return { writer, calls };
}

const story: StoryContext = { premise: "A heist", genre: "thriller", tone: "tense", language: "en" };
const passage: GeneratedPassage = {
  title: "The Vault",
  content: "She cracked the lock.",
  summary: "A thief opens the vault.",
};

describe("createStory", () => {
  it("inserts the story, root node, links them, and returns ids", async () => {
    const { writer, calls } = fakeWriter();

    const result = await createStory({
      story,
      userId: "user-1",
      model: "openai/gpt-5.4-nano",
      generate: async () => passage,
      writer,
    });

    expect(result).toEqual({ storyId: "story-1", rootNodeId: "node-1" });

    expect(calls.insertStory).toEqual([
      {
        userId: "user-1",
        title: passage.title,
        premise: story.premise,
        genre: story.genre,
        tone: story.tone,
        language: story.language,
      },
    ]);

    expect(calls.insertRootNode).toEqual([
      {
        storyId: "story-1",
        title: passage.title,
        content: passage.content,
        summary: passage.summary,
        modelUsed: "openai/gpt-5.4-nano",
        createdBy: "user-1",
      },
    ]);

    expect(calls.setRootNode).toEqual([{ storyId: "story-1", nodeId: "node-1" }]);
  });

  it("does not persist anything when generation fails", async () => {
    const { writer, calls } = fakeWriter();

    await expect(
      createStory({
        story,
        userId: "user-1",
        model: "m",
        generate: async () => {
          throw new Error("generation failed");
        },
        writer,
      }),
    ).rejects.toThrow("generation failed");

    expect(calls.insertStory).toEqual([]);
    expect(calls.insertRootNode).toEqual([]);
    expect(calls.setRootNode).toEqual([]);
  });
});
