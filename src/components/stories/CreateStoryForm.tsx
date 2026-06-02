"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { PixSpinner } from "@/components/pixel/PixSpinner";
import { LANGUAGES, DEFAULT_LANGUAGE } from "@/domains/generation/domain/language";

const GENRES = ["Fantasy", "Sci-Fi", "Mystery", "Horror", "Adventure", "Fable"];
const TONES = ["Lyrical", "Dark", "Whimsical", "Tense", "Epic"];

export function CreateStoryForm() {
  const t = useTranslations("create");
  const router = useRouter();
  const [premise, setPremise] = useState("");
  const [genre, setGenre] = useState("Fantasy");
  const [tone, setTone] = useState("Lyrical");
  const [language, setLanguage] = useState<string>(DEFAULT_LANGUAGE);
  const [err, setErr] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  async function go() {
    if (!premise.trim()) {
      setErr(t("sparkError"));
      return;
    }
    setGenerating(true);
    setErr(null);
    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ premise: premise.trim(), genre, tone, language }),
      });
      const data = (await res.json().catch(() => ({}))) as { storyId?: string; error?: string };
      if (!res.ok || !data.storyId) {
        throw new Error(data.error ?? t("failed"));
      }
      router.push(`/stories/${data.storyId}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("failed"));
      setGenerating(false);
    }
  }

  return (
    <div className="screen bg-dune scroll-y vignette">
      <div style={{ position: "absolute", inset: 0, background: "rgba(28,21,14,.6)" }} />
      <div style={{ position: "relative", maxWidth: 660, margin: "0 auto", padding: "28px 20px 60px" }}>
        <Link className="btn btn--ghost" href="/stories" style={{ marginBottom: 16 }}>
          <PixelIcon name="back" size={16} color="var(--sand-light)" /> {t("back")}
        </Link>
        <div className="frame frame--papyrus" style={{ padding: "30px 30px 34px" }}>
          <h1 className="h1" style={{ color: "var(--ink)", fontSize: 30, marginBottom: 6 }}>
            {t("title")}
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "var(--muted)", marginBottom: 24 }}>
            {t("intro")}
          </p>

          <label className="label label--ink">{t("sparkLabel")}</label>
          <textarea
            className="field"
            rows={4}
            value={premise}
            onChange={(e) => {
              setPremise(e.target.value);
              if (err) setErr(null);
            }}
            placeholder={t("sparkPlaceholder")}
            style={err ? { borderColor: "var(--carnelian)" } : undefined}
          />
          {err && <p className="hint hint--err">{err}</p>}

          <div className="fret" style={{ margin: "24px 0", opacity: 0.4 }} />

          <label className="label label--ink">{t("genreLabel")}</label>
          <div className="row gap-2 wrap" style={{ marginBottom: 22 }}>
            {GENRES.map((g) => (
              <button
                key={g}
                type="button"
                className={"chip chip--gold" + (genre === g ? " chip--on" : "")}
                onClick={() => setGenre(g)}
              >
                {g}
              </button>
            ))}
          </div>

          <label className="label label--ink">{t("toneLabel")}</label>
          <div className="row gap-2 wrap" style={{ marginBottom: 22 }}>
            {TONES.map((t) => (
              <button
                key={t}
                type="button"
                className={"chip" + (tone === t ? " chip--on" : "")}
                onClick={() => setTone(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <label className="label label--ink">{t("languageLabel")}</label>
          <div className="row gap-2 wrap" style={{ marginBottom: 28 }}>
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                className={"chip" + (language === l.code ? " chip--on" : "")}
                onClick={() => setLanguage(l.code)}
              >
                {l.label}
              </button>
            ))}
          </div>

          {generating ? (
            <div className="frame frame--basalt" style={{ padding: "18px", display: "grid", placeItems: "center" }}>
              <PixSpinner label={t("generating")} />
            </div>
          ) : (
            <button className="btn btn--block btn--lg" type="button" onClick={go}>
              <PixelIcon name="scroll" size={18} color="#2B2118" /> {t("submit")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
