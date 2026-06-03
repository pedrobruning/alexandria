// The JSON shape every generation must return: a passage plus its chapter title
// and one-line summary. Adapters that support structured outputs (e.g. OpenRouter
// `response_format: json_schema`) enforce this; the prompt requests the same shape
// and `parseGeneration` stays the fallback for models that ignore the schema.
// Pure — no provider or framework types.

export const PASSAGE_SCHEMA_NAME = "passage";

export const PASSAGE_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    title: { type: "string", description: "A 2-4 word evocative chapter title" },
    content: { type: "string", description: "The passage prose, about 250 words" },
    summary: { type: "string", description: "One sentence summarizing the passage" },
  },
  required: ["title", "content", "summary"],
  additionalProperties: false,
};
