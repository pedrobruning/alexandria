// Story-creation options. `value` is the canonical English label persisted on
// the story and injected into the (English) generation prompt; `key` selects
// the UI translation under the `create.genres` / `create.tones` namespaces.

export const GENRE_OPTIONS = [
  { value: "Fantasy", key: "fantasy" },
  { value: "Sci-Fi", key: "sciFi" },
  { value: "Mystery", key: "mystery" },
  { value: "Horror", key: "horror" },
  { value: "Adventure", key: "adventure" },
  { value: "Fable", key: "fable" },
] as const;

export const TONE_OPTIONS = [
  { value: "Lyrical", key: "lyrical" },
  { value: "Dark", key: "dark" },
  { value: "Whimsical", key: "whimsical" },
  { value: "Tense", key: "tense" },
  { value: "Epic", key: "epic" },
] as const;

// Maps a stored genre/tone value back to its translation key, or null when the
// value isn't a known option (callers fall back to showing the raw value).
export function genreKey(value: string): string | null {
  return GENRE_OPTIONS.find((g) => g.value === value)?.key ?? null;
}

export function toneKey(value: string): string | null {
  return TONE_OPTIONS.find((t) => t.value === value)?.key ?? null;
}
