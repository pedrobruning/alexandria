import { describe, expect, it } from "vitest";
import { getDemoStory } from "@/domains/onboarding/domain/demoStory";
import { LANGUAGES } from "@/domains/generation/domain/language";

describe("getDemoStory", () => {
  for (const { code } of LANGUAGES) {
    describe(`locale ${code}`, () => {
      const story = getDemoStory(code);

      it("has non-empty story metadata", () => {
        expect(story.title.trim()).not.toBe("");
        expect(story.premise.trim()).not.toBe("");
        expect(story.genre.trim()).not.toBe("");
        expect(story.tone.trim()).not.toBe("");
      });

      it("has exactly one root node (parentKey === null) first in the list", () => {
        const roots = story.nodes.filter((n) => n.parentKey === null);
        expect(roots).toHaveLength(1);
        expect(story.nodes[0].parentKey).toBeNull();
      });

      it("has unique node keys and every parentKey resolves to a real node", () => {
        const keys = story.nodes.map((n) => n.key);
        expect(new Set(keys).size).toBe(keys.length);
        for (const n of story.nodes) {
          if (n.parentKey !== null) expect(keys).toContain(n.parentKey);
        }
      });

      it("contains a fork point: some node has at least two children", () => {
        const childCount = new Map<string, number>();
        for (const n of story.nodes) {
          if (n.parentKey) childCount.set(n.parentKey, (childCount.get(n.parentKey) ?? 0) + 1);
        }
        expect(Math.max(...childCount.values())).toBeGreaterThanOrEqual(2);
      });

      it("every node carries title, content, and summary", () => {
        for (const n of story.nodes) {
          expect(n.title.trim()).not.toBe("");
          expect(n.content.trim()).not.toBe("");
          expect(n.summary.trim()).not.toBe("");
        }
      });

      it("non-root nodes demonstrate steering", () => {
        const steered = story.nodes.filter((n) => n.parentKey !== null && n.steer);
        expect(steered.length).toBeGreaterThanOrEqual(1);
      });
    });
  }

  it("falls back to English for an unknown locale", () => {
    expect(getDemoStory("xx")).toEqual(getDemoStory("en"));
  });
});
