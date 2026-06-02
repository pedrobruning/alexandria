import { describe, expect, it, vi } from "vitest";
import { generatePassage } from "@/domains/generation/application/generatePassage";
import type { OpenRouterCaller } from "@/domains/generation/infrastructure/openrouter";
import type { StoryContext } from "@/domains/generation/domain/types";

const story: StoryContext = { premise: "A heist", genre: "thriller", tone: "tense", language: "en" };

function fakeCaller(content: string): OpenRouterCaller {
  return vi.fn(async () => content);
}

describe("generatePassage", () => {
  it("uses root messages and parses the result when no ancestors are given", async () => {
    const call = fakeCaller('{"content":"Opening.","summary":"It opens."}');
    const out = await generatePassage({ story, apiKey: "k", model: "m", call });

    expect(out).toEqual({ title: "It opens", content: "Opening.", summary: "It opens." });
    const messages = (call as ReturnType<typeof vi.fn>).mock.calls[0][0].messages;
    expect(messages[1].content).toContain("opening passage");
  });

  it("uses branch messages with steer when ancestors are given", async () => {
    const call = fakeCaller('{"content":"Next.","summary":"It continues."}');
    await generatePassage({
      story,
      apiKey: "k",
      model: "m",
      ancestors: { summaries: ["s1"], lastPassage: "parent" },
      steer: "she escapes",
      call,
    });

    const messages = (call as ReturnType<typeof vi.fn>).mock.calls[0][0].messages;
    expect(messages[1].content).toContain("she escapes");
    expect(messages[1].content).toContain("parent");
  });

  it("instructs the model to write in the story's language", async () => {
    const call = fakeCaller('{"content":"x","summary":"y"}');
    await generatePassage({
      story: { ...story, language: "pt-BR" },
      apiKey: "k",
      model: "m",
      call,
    });

    const messages = (call as ReturnType<typeof vi.fn>).mock.calls[0][0].messages;
    expect(messages[1].content).toContain("Brazilian Portuguese");
  });

  it("passes apiKey and model through to the caller", async () => {
    const call = fakeCaller('{"content":"x","summary":"y"}');
    await generatePassage({ story, apiKey: "secret-key", model: "openai/gpt-5.4-nano", call });

    const params = (call as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(params.apiKey).toBe("secret-key");
    expect(params.model).toBe("openai/gpt-5.4-nano");
  });
});
