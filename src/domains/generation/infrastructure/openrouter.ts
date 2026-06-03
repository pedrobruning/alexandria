import { OpenRouter } from "@openrouter/sdk";
import type { ChatMessages } from "@openrouter/sdk/models";
import type { ModelCaller } from "../domain/modelCaller";

// Live OpenRouter adapter, backed by the official SDK. Returns the assistant
// message content (a JSON string the prompt asks for). The API key is never
// logged or echoed into error messages.
export const callOpenRouter: ModelCaller = async ({ apiKey, model, messages, signal }) => {
  const client = new OpenRouter({ apiKey });

  const result = await client.chat.send(
    {
      chatRequest: {
        model,
        messages: messages as ChatMessages[],
        stream: false,
      },
    },
    signal ? { signal } : undefined,
  );

  const content = result.choices[0]?.message?.content;
  if (typeof content !== "string" || !content) {
    throw new Error("OpenRouter returned no message content");
  }
  return content;
};
