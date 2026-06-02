import { create } from "zustand";
import { persist } from "zustand/middleware";

// Client-only BYOK settings. The OpenRouter key lives in localStorage and is
// sent transiently per-request; it is never persisted or logged server-side.
// An empty `model` means "let the route pick the default model".
type SettingsState = {
  apiKey: string;
  model: string;
  setApiKey: (apiKey: string) => void;
  setModel: (model: string) => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: "",
      model: "",
      setApiKey: (apiKey) => set({ apiKey }),
      setModel: (model) => set({ model }),
    }),
    { name: "alexandria-settings" },
  ),
);
