import type { GeneratedPassage } from "./types";

// Derive a one-line summary from passage text when the model didn't supply one.
function deriveSummary(content: string): string {
  const firstSentence = content.match(/^.*?[.!?](\s|$)/)?.[0]?.trim();
  const base = firstSentence || content;
  return base.length > 140 ? `${base.slice(0, 137).trimEnd()}...` : base.trim();
}

// Derive a short chapter title from a summary when the model didn't supply one:
// the first few words, title-cased lightly by leaving the model's casing intact.
function deriveTitle(summary: string): string {
  const words = summary.replace(/["']/g, "").trim().split(/\s+/).slice(0, 4).join(" ");
  const trimmed = words.replace(/[.,;:!?]+$/, "");
  return trimmed || "Untitled Passage";
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
    const title =
      typeof obj.title === "string" && obj.title.trim()
        ? obj.title.trim().replace(/^["']|["']$/g, "")
        : deriveTitle(summary);
    return { title, content, summary };
  }

  const summary = deriveSummary(text);
  return { title: deriveTitle(summary), content: text, summary };
}
