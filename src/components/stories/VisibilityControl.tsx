"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import type { Visibility } from "@/domains/stories/domain/types";

const STATES: Visibility[] = ["private", "unlisted", "public"];

// Owner-only control to set a story's sharing state. The PATCH route enforces
// owner-only via RLS; this just drives it and refreshes so the reader re-reads.
export function VisibilityControl({
  storyId,
  visibility,
}: {
  storyId: string;
  visibility: Visibility;
}) {
  const t = useTranslations("reader.visibility");
  const router = useRouter();
  const [current, setCurrent] = useState<Visibility>(visibility);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(false);
  const [copied, setCopied] = useState(false);

  async function setVisibility(next: Visibility) {
    if (next === current || saving) return;
    setSaving(true);
    setErr(false);
    try {
      const res = await fetch(`/api/stories/${storyId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ visibility: next }),
      });
      if (!res.ok) throw new Error("patch failed");
      setCurrent(next);
      router.refresh();
    } catch {
      setErr(true);
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  return (
    <section className="frame frame--basalt" style={{ padding: "16px 18px" }}>
      <label className="label" style={{ marginBottom: 10 }}>
        {t("title")}
      </label>
      <div className="row center wrap gap-2">
        {STATES.map((state) => {
          const active = state === current;
          return (
            <button
              key={state}
              type="button"
              className="chip"
              aria-pressed={active}
              disabled={active || saving}
              onClick={() => setVisibility(state)}
              style={{ cursor: active || saving ? "default" : "pointer" }}
            >
              {t(state)}
            </button>
          );
        })}
      </div>
      <p className="caption" style={{ marginTop: 10 }}>
        {t(`${current}Hint`)}
      </p>
      {current !== "private" && (
        <button
          type="button"
          className="chip"
          onClick={copyLink}
          style={{ marginTop: 12, cursor: "pointer" }}
        >
          <PixelIcon name="fork" size={12} color="var(--sand-light)" />{" "}
          {copied ? t("copied") : t("copyLink")}
        </button>
      )}
      {err && <p className="hint hint--err" style={{ marginTop: 8 }}>{t("saveFailed")}</p>}
    </section>
  );
}
