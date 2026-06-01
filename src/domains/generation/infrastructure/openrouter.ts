import type { ChatMessage } from "../domain/types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export type OpenRouterCallParams = {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
};

// The single seam the generation domain calls through. Injectable so use cases
// and tests can substitute a fake without touching the network.
export type OpenRouterCaller = (params: OpenRouterCallParams) => Promise<string>;

// Live OpenRouter chat-completions call. Returns the assistant message content.
// The API key is never logged or echoed into error messages.
export const callOpenRouter: OpenRouterCaller = async ({ apiKey, model, messages, signal }) => {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages }),
    signal,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenRouter request failed (${res.status}): ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter returned no message content");
  }
  return content;
};
