import type { AncestorContext } from "./types";

// One ancestor on the path from root to the node being branched from.
export type PathNode = { summary: string; content: string };

// Assemble branch context from the root→parent path (inclusive).
// summaries: every ancestor's summary; lastPassage: the immediate parent's
// full text. Throws on an empty path — branch generation requires a parent.
export function assembleAncestors(path: PathNode[]): AncestorContext {
  if (path.length === 0) {
    throw new Error("assembleAncestors: branch generation requires a parent path");
  }
  return {
    summaries: path.map((n) => n.summary),
    lastPassage: path[path.length - 1].content,
  };
}
