// Languages a story can be generated in. `code` is what we persist and send
// over the wire; `promptName` is the name we give the model in the prompt.
export const LANGUAGES = [
  { code: "en", label: "English", promptName: "English" },
  { code: "pt-BR", label: "Português (Brasil)", promptName: "Brazilian Portuguese" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export const DEFAULT_LANGUAGE: LanguageCode = "en";

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === "string" && LANGUAGES.some((l) => l.code === value);
}

// The model-facing language name; falls back to English for unknown codes.
export function languagePromptName(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.promptName ?? "English";
}
