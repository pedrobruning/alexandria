import type { ModelCaller } from "../domain/modelCaller";
import { callOpenRouter } from "./openrouter";

// Picks the adapter that knows how to talk to a given model. Everything routes
// through OpenRouter today; models needing a different client (e.g. the Anthropic
// SDK) get their own adapter and a branch here, without touching callers.
export function resolveModelCaller(_model: string): ModelCaller {
  return callOpenRouter;
}
