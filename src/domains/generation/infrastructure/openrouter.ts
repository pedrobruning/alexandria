import { OpenRouter } from "@openrouter/sdk";
import type { ChatMessages } from "@openrouter/sdk/models";
import type { ModelCaller } from "../domain/modelCaller";
import { PASSAGE_JSON_SCHEMA, PASSAGE_SCHEMA_NAME } from "../domain/passageSchema";

// Live OpenRouter adapter, backed by the official SDK. Returns the assistant
// message content. The API key is never logged or echoed into error messages.
// `responseFormat` enforces the passage schema on models that support structured
// outputs; OpenRouter drops it for models that don't (require_parameters=false),
// so parseGeneration stays the fallback. Either way content is a JSON string.
export const callOpenRouter: ModelCaller = async ({ apiKey, model, messages, signal }) => {
  const client = new OpenRouter({ apiKey });

  const result = await client.chat.send(
    {
      chatRequest: {
        model,
        messages: messages as ChatMessages[],
        stream: false,
        responseFormat: {
          type: "json_schema",
          jsonSchema: { name: PASSAGE_SCHEMA_NAME, strict: true, schema: PASSAGE_JSON_SCHEMA },
        },
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
