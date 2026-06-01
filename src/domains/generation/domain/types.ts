export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = { role: ChatRole; content: string };

// The story-level context that conditions every generation.
export type StoryContext = {
  premise: string;
  genre: string | null;
  tone: string | null;
};

// The path-level context for a branch: ancestor summaries (root→parent) plus
// the full text of the immediate parent passage.
export type AncestorContext = {
  summaries: string[];
  lastPassage: string;
};

// One produced passage and its one-line summary (used as cheap ancestor context
// for deeper descendants).
export type GeneratedPassage = {
  content: string;
  summary: string;
};
