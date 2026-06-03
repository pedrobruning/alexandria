import type { ChatMessage } from "./types";

export type ModelCallParams = {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
};

// The provider-neutral seam the generation domain calls through. Each provider
// (OpenRouter today, Anthropic later) supplies an adapter implementing this in
// `infrastructure/`; `resolveModelCaller` picks one per model. Injectable so use
// cases and tests can substitute a fake without touching the network.
export type ModelCaller = (params: ModelCallParams) => Promise<string>;
