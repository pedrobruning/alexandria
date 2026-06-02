import { describe, expect, it } from "vitest";
import {
  buildBranchMessages,
  buildRootMessages,
  SYSTEM_PROMPT,
} from "@/domains/generation/domain/buildPrompt";
import type { StoryContext } from "@/domains/generation/domain/types";

const story: StoryContext = {
  premise: "A lighthouse keeper",
  genre: "mystery",
  tone: "eerie",
  language: "en",
};

describe("buildRootMessages", () => {
  it("includes the system prompt, premise, and metadata", () => {
    const [system, user] = buildRootMessages(story);
    expect(system).toEqual({ role: "system", content: SYSTEM_PROMPT });
    expect(user.content).toContain("A lighthouse keeper");
    expect(user.content).toContain("Genre: mystery");
    expect(user.content).toContain("Tone: eerie");
    expect(user.content).toContain("opening passage");
  });

  it("omits absent metadata gracefully", () => {
    const [, user] = buildRootMessages({ premise: "P", genre: null, tone: null, language: "en" });
    expect(user.content).not.toContain("Genre:");
    expect(user.content).not.toContain("Tone:");
  });

  it("instructs the model to write in the story's language", () => {
    const [, user] = buildRootMessages({ ...story, language: "pt-BR" });
    expect(user.content).toContain("Brazilian Portuguese");
  });
});

describe("buildBranchMessages", () => {
  const ancestors = { summaries: ["s1", "s2"], lastPassage: "the parent passage" };

  it("includes summaries, parent passage, and the steer nudge", () => {
    const [, user] = buildBranchMessages(story, ancestors, "but she refuses the offer");
    expect(user.content).toContain("s1\ns2");
    expect(user.content).toContain("the parent passage");
    expect(user.content).toContain("but she refuses the offer");
  });

  it("falls back to a neutral continuation when steer is blank", () => {
    const [, user] = buildBranchMessages(story, ancestors, "   ");
    expect(user.content).toContain("Continue the story naturally");
  });
});
