// UI locales for the interface chrome. Distinct from a story's generation
// language (see domains/generation/domain/language.ts): a reader can browse the
// site in one language while generating stories in another.
export const LOCALES = ["en", "pt-BR"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  "pt-BR": "Português",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

// Picks the best UI locale from an Accept-Language header, falling back to the
// default. Matches on the primary subtag (e.g. "pt-PT" → "pt-BR", "en-US" → "en").
export function matchLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  for (const part of acceptLanguage.split(",")) {
    const tag = part.split(";")[0].trim().toLowerCase();
    if (!tag) continue;
    if (isLocale(tag)) return tag;
    const primary = tag.split("-")[0];
    const byPrimary = LOCALES.find((l) => l.toLowerCase().split("-")[0] === primary);
    if (byPrimary) return byPrimary;
  }
  return DEFAULT_LOCALE;
}
