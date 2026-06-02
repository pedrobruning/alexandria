export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = { role: ChatRole; content: string };

// The story-level context that conditions every generation. `language` is a
// language code (see domain/language.ts); every passage in a story shares it.
export type StoryContext = {
  premise: string;
  genre: string | null;
  tone: string | null;
  language: string;
};

// The path-level context for a branch: ancestor summaries (root→parent) plus
// the full text of the immediate parent passage.
export type AncestorContext = {
  summaries: string[];
  lastPassage: string;
};

// One produced passage with a short chapter-style title and a one-line summary
// (the summary is reused as cheap ancestor context for deeper descendants).
export type GeneratedPassage = {
  title: string;
  content: string;
  summary: string;
};
