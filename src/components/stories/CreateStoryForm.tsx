"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { PixSpinner } from "@/components/pixel/PixSpinner";
import { LANGUAGES, DEFAULT_LANGUAGE } from "@/domains/generation/domain/language";
import { GENRE_OPTIONS, TONE_OPTIONS } from "@/domains/stories/domain/options";
import { useSettings } from "@/store/settings";

export function CreateStoryForm() {
  const t = useTranslations("create");
  const router = useRouter();
  const apiKey = useSettings((s) => s.apiKey);
  const model = useSettings((s) => s.model);
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
        body: JSON.stringify({
          premise: premise.trim(),
          genre,
          tone,
          language,
          apiKey: apiKey || null,
          model: model || null,
        }),
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
      <div className="fixed inset-0 bg-[rgba(28,21,14,.6)]" />
      <div className="relative mx-auto max-w-[660px] px-4 pt-7 pb-14 sm:px-5">
        <Link className="btn btn--ghost mb-4" href="/stories">
          <PixelIcon name="back" size={16} color="var(--sand-light)" /> {t("back")}
        </Link>
        <div className="frame frame--papyrus px-6 pt-8 pb-7 sm:p-[30px_30px_34px]">
          <h1 className="h1 mb-1.5 text-[28px] text-ink sm:text-[30px]">{t("title")}</h1>
          <p className="mb-6 font-body text-base text-muted">{t("intro")}</p>

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

          <div className="fret my-6 opacity-40" />

          <label className="label label--ink">{t("genreLabel")}</label>
          <div className="row gap-2 wrap mb-[22px]">
            {GENRE_OPTIONS.map((g) => (
              <button
                key={g.value}
                type="button"
                className={"chip chip--gold chip--ink" + (genre === g.value ? " chip--on" : "")}
                onClick={() => setGenre(g.value)}
              >
                {t(`genres.${g.key}`)}
              </button>
            ))}
          </div>

          <label className="label label--ink">{t("toneLabel")}</label>
          <div className="row gap-2 wrap mb-[22px]">
            {TONE_OPTIONS.map((tn) => (
              <button
                key={tn.value}
                type="button"
                className={"chip chip--ink" + (tone === tn.value ? " chip--on" : "")}
                onClick={() => setTone(tn.value)}
              >
                {t(`tones.${tn.key}`)}
              </button>
            ))}
          </div>

          <label className="label label--ink">{t("languageLabel")}</label>
          <div className="row gap-2 wrap mb-7">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                className={"chip chip--ink" + (language === l.code ? " chip--on" : "")}
                onClick={() => setLanguage(l.code)}
              >
                {t(`languages.${l.code}`)}
              </button>
            ))}
          </div>

          {generating ? (
            <div className="frame frame--basalt grid place-items-center p-[18px]">
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
