import type { GeneratedPassage } from "./types";

// Derive a one-line summary from passage text when the model didn't supply one.
function deriveSummary(content: string): string {
  const firstSentence = content.match(/^.*?[.!?](\s|$)/)?.[0]?.trim();
  const base = firstSentence || content;
  return base.length > 140 ? `${base.slice(0, 137).trimEnd()}...` : base.trim();
}

function tryParseJsonObject(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

// Parse a model response into a passage + summary. Prefers the structured JSON
// the prompt requests; falls back to treating the whole text as the passage so
// a non-conforming model never breaks generation.
export function parseGeneration(raw: string): GeneratedPassage {
  const text = raw.trim();
  if (!text) {
    throw new Error("parseGeneration: empty model response");
  }

  const obj = tryParseJsonObject(text);
  if (obj && typeof obj.content === "string" && obj.content.trim()) {
    const content = obj.content.trim();
    const summary =
      typeof obj.summary === "string" && obj.summary.trim()
        ? obj.summary.trim()
        : deriveSummary(content);
    return { content, summary };
  }

  return { content: text, summary: deriveSummary(text) };
}
