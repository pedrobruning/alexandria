import type { AncestorContext, ChatMessage, StoryContext } from "./types";

export const TARGET_WORDS = 250;

export const SYSTEM_PROMPT = [
  "You are a fiction engine for a branching story app.",
  `Write vivid, self-contained prose passages of about ${TARGET_WORDS} words.`,
  "Stay consistent with the premise, genre, tone, and the story so far.",
  "Respond ONLY with a JSON object of the form:",
  '{"content": "<the passage>", "summary": "<one sentence summarizing it>"}',
  "No markdown, no commentary outside the JSON.",
].join("\n");

function storyHeader(story: StoryContext): string {
  const meta = [story.genre && `Genre: ${story.genre}`, story.tone && `Tone: ${story.tone}`]
    .filter(Boolean)
    .join(" · ");
  return `Premise: ${story.premise}${meta ? `\n${meta}` : ""}`;
}

// Messages for the root passage of a new story.
export function buildRootMessages(story: StoryContext): ChatMessage[] {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `${storyHeader(story)}\n\nWrite the opening passage (~${TARGET_WORDS} words).`,
    },
  ];
}

// Messages for a branch continuation, with optional steering nudge.
export function buildBranchMessages(
  story: StoryContext,
  ancestors: AncestorContext,
  steer: string | null,
): ChatMessage[] {
  const path = ancestors.summaries.join("\n");
  const direction = steer?.trim()
    ? `Continue the story, but: ${steer.trim()}`
    : "Continue the story naturally.";
  return [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content:
        `${storyHeader(story)}\n\n` +
        `Story so far (summaries):\n${path}\n\n` +
        `Latest passage:\n${ancestors.lastPassage}\n\n` +
        `${direction}\nWrite the next passage (~${TARGET_WORDS} words).`,
    },
  ];
}
