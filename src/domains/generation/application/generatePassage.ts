import { buildBranchMessages, buildRootMessages } from "../domain/buildPrompt";
import { parseGeneration } from "../domain/parse";
import type { AncestorContext, GeneratedPassage, StoryContext } from "../domain/types";
import { callOpenRouter, type OpenRouterCaller } from "../infrastructure/openrouter";

export type GeneratePassageInput = {
  story: StoryContext;
  apiKey: string;
  model: string;
  // Omit `ancestors` to generate a root passage; provide it to branch.
  ancestors?: AncestorContext;
  steer?: string | null;
  signal?: AbortSignal;
  // Injectable for tests; defaults to the live OpenRouter client.
  call?: OpenRouterCaller;
};

// Orchestrates one generation: build messages → call provider → parse result.
// Provider-agnostic; the caller supplies key + model (server default or BYOK).
export async function generatePassage(input: GeneratePassageInput): Promise<GeneratedPassage> {
  const messages = input.ancestors
    ? buildBranchMessages(input.story, input.ancestors, input.steer ?? null)
    : buildRootMessages(input.story);

  const call = input.call ?? callOpenRouter;
  const raw = await call({
    apiKey: input.apiKey,
    model: input.model,
    messages,
    signal: input.signal,
  });

  return parseGeneration(raw);
}
