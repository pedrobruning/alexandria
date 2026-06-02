"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { useSettings } from "@/store/settings";

// Curated OpenRouter models for BYOK. An empty value means "use the app default
// model"; the route maps it back to OPENROUTER_DEFAULT_MODEL. Any of these (or
// the default) is honoured only when a BYOK key is set — the shared server key
// is always pinned to the default model.
const MODEL_OPTIONS = [
  { value: "", key: "default" },
  { value: "openai/gpt-4o-mini", label: "GPT-4o mini" },
  { value: "openai/gpt-4o", label: "GPT-4o" },
  { value: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "google/gemini-flash-1.5", label: "Gemini 1.5 Flash" },
  { value: "meta-llama/llama-3.1-70b-instruct", label: "Llama 3.1 70B" },
] as const;

function SettingsModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("settings");
  const apiKey = useSettings((s) => s.apiKey);
  const model = useSettings((s) => s.model);
  const setApiKey = useSettings((s) => s.setApiKey);
  const setModel = useSettings((s) => s.setModel);

  const [draftKey, setDraftKey] = useState(apiKey);
  const [draftModel, setDraftModel] = useState(model);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function save() {
    setApiKey(draftKey.trim());
    setModel(draftModel.trim());
    setSaved(true);
  }

  function clear() {
    setDraftKey("");
    setDraftModel("");
    setApiKey("");
    setModel("");
    setSaved(false);
  }

  return (
    <div
      className="atlas-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
      onClick={onClose}
    >
      <div className="atlas-modal" onClick={(e) => e.stopPropagation()}>
        <div className="atlas-modal__bar">
          <span className="node-title" style={{ color: "var(--sand-light)" }}>
            {t("title")}
          </span>
          <button
            type="button"
            className="chip"
            aria-label={t("close")}
            onClick={onClose}
            style={{ cursor: "pointer" }}
          >
            <PixelIcon name="x" size={14} color="var(--sand-light)" />
          </button>
        </div>
        <div className="atlas-modal__body" style={{ padding: "22px 22px 26px", overflowY: "auto" }}>
          <p className="caption" style={{ marginBottom: 18 }}>
            {t("intro")}
          </p>

          <label className="label" htmlFor="byok-key">
            {t("keyLabel")}
          </label>
          <input
            id="byok-key"
            className="field field--dark"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={draftKey}
            onChange={(e) => {
              setDraftKey(e.target.value);
              setSaved(false);
            }}
            placeholder={t("keyPlaceholder")}
          />

          <label className="label" htmlFor="byok-model" style={{ marginTop: 18 }}>
            {t("modelLabel")}
          </label>
          <select
            id="byok-model"
            className="field field--dark"
            value={draftModel}
            onChange={(e) => {
              setDraftModel(e.target.value);
              setSaved(false);
            }}
          >
            {MODEL_OPTIONS.map((m) => (
              <option key={m.value || "default"} value={m.value}>
                {"key" in m ? t(`models.${m.key}`) : m.label}
              </option>
            ))}
          </select>

          <p className="caption" style={{ marginTop: 18 }}>
            {t("privacy")}
          </p>

          <div className="row center wrap gap-3" style={{ marginTop: 18 }}>
            <button className="btn" type="button" onClick={save}>
              <PixelIcon name="check" size={16} color="#2B2118" /> {t("save")}
            </button>
            <button className="btn btn--ghost" type="button" onClick={clear}>
              {t("clear")}
            </button>
            {saved && (
              <span className="caption" style={{ color: "var(--lapis-bright)" }}>
                {t("saved")}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SettingsButton() {
  const t = useTranslations("settings");
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="btn btn--ghost"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t("open")}
      >
        <PixelIcon name="gear" size={16} color="var(--sand-light)" />
      </button>
      {open && <SettingsModal onClose={() => setOpen(false)} />}
    </>
  );
}
