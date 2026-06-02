"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { PixSpinner } from "@/components/pixel/PixSpinner";
import { TimeVeil } from "@/components/reader/TimeVeil";
import { GeneratingStars } from "@/components/reader/GeneratingStars";
import { childrenOf, pathFromRoot } from "@/lib/tree/path";
import { useSettings } from "@/store/settings";
import { LANGUAGES } from "@/domains/generation/domain/language";
import type { StoryNode } from "@/domains/stories/domain/types";

export function Reader({
  storyId,
  nodes,
  selectedId,
  onSelect,
  isDemo,
  language,
  quotaRemaining,
}: {
  storyId: string;
  nodes: StoryNode[];
  selectedId: string;
  onSelect: (id: string) => void;
  isDemo: boolean;
  language: string;
  quotaRemaining: number;
}) {
  const t = useTranslations("reader");
  const td = useTranslations("onboarding");
  const router = useRouter();
  const apiKey = useSettings((s) => s.apiKey);
  const model = useSettings((s) => s.model);
  const rootRef = useRef<HTMLDivElement>(null);
  const [steer, setSteer] = useState("");
  const [forking, setForking] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);

  // Reset the steer box / error whenever the selection changes (from anywhere —
  // breadcrumb, child, or Atlas). React's render-time reset pattern. The bumped
  // sequence re-keys the passage so the reveal replays, and arms the veil — but
  // only on real jumps, never on the first mount (jumpSeq stays 0 then).
  const [lastSelected, setLastSelected] = useState(selectedId);
  const [jumpSeq, setJumpSeq] = useState(0);
  const [jumping, setJumping] = useState(false);
  if (selectedId !== lastSelected) {
    setLastSelected(selectedId);
    setSteer("");
    setErr(null);
    setJumpSeq((s) => s + 1);
    setJumping(true);
  }

  useEffect(() => {
    if (!jumping) return;
    const id = setTimeout(() => setJumping(false), 1750);
    return () => clearTimeout(id);
  }, [jumping, jumpSeq]);

  // A jump always begins the new passage from its opening line — scroll the
  // reader's container back to the top (the previous selection may have left us
  // deep down a long passage or its child list).
  useEffect(() => {
    if (jumpSeq === 0) return;
    const scroller = rootRef.current?.closest<HTMLElement>(".scroll-y");
    scroller?.scrollTo({ top: 0, behavior: "smooth" });
  }, [jumpSeq]);

  const trail = pathFromRoot(nodes, selectedId);
  const current = trail[trail.length - 1];
  const children = childrenOf(nodes, selectedId);

  // Re-seed the demo in another language. The old demo is deleted server-side,
  // so the story id changes — replace (not push) the URL to avoid a dead back
  // entry, then refresh to pull the freshly seeded tree.
  async function switchLanguage(locale: string) {
    if (locale === language || switching) return;
    setSwitching(true);
    try {
      const res = await fetch("/api/onboarding/demo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale, replace: true }),
      });
      const data = (await res.json().catch(() => ({}))) as { storyId?: string };
      if (res.ok && data.storyId) {
        router.replace(`/stories/${data.storyId}`);
        router.refresh();
      }
    } finally {
      setSwitching(false);
    }
  }

  async function fork() {
    if (isDemo) return;
    setForking(true);
    setErr(null);
    try {
      const res = await fetch(`/api/stories/${storyId}/branch`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          parentId: selectedId,
          steer: steer.trim() || null,
          apiKey: apiKey || null,
          model: model || null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { nodeId?: string; error?: string };
      if (res.status === 429) throw new Error(t("quotaExceeded"));
      if (!res.ok || !data.nodeId) throw new Error(data.error ?? t("forkFailed"));
      setSteer("");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("forkFailed"));
    } finally {
      setForking(false);
    }
  }

  return (
    <div ref={rootRef} style={{ maxWidth: 760, margin: "0 auto" }}>
      <nav className="row center wrap gap-2" aria-label={t("breadcrumb")} style={{ marginBottom: 22 }}>
        {trail.map((node, i) => {
          const isCurrent = node.id === selectedId;
          return (
            <span key={node.id} className="row center gap-2">
              {i > 0 && (
                <PixelIcon name="fork" size={11} color="var(--muted)" style={{ transform: "rotate(90deg)" }} />
              )}
              <button
                type="button"
                className="chip"
                aria-current={isCurrent ? "page" : undefined}
                disabled={isCurrent}
                onClick={() => onSelect(node.id)}
                style={{ cursor: isCurrent ? "default" : "pointer" }}
              >
                {node.title}
              </button>
            </span>
          );
        })}
      </nav>

      {/* The veil (a sibling overlay) covers the column while React swaps the
          passage underneath; as it parts, the keyed article reveals center-out.
          Both are re-keyed by jumpSeq so the time jump replays on every move. */}
      <div style={{ position: "relative" }}>
        {jumping && <TimeVeil key={`veil-${jumpSeq}`} />}
        <article
          key={`passage-${jumpSeq}`}
          className={`frame frame--basalt${jumpSeq > 0 ? " jump-reveal" : ""}`}
          style={{ padding: "28px 30px 30px", overflow: "hidden" }}
        >
          <h1 className="h2" style={{ color: "var(--sand-light)", marginBottom: 16 }}>
            {current.title}
          </h1>
          <div className="prose" style={{ color: "var(--sand-light)", maxWidth: "none" }}>
            {current.content.split(/\n{2,}/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </article>
      </div>

      <section
        className="frame frame--basalt"
        data-tour="steer"
        style={{ marginTop: 22, padding: "20px 22px" }}
      >
        <label className="label" htmlFor="steer">
          {t("steerLabel")}
        </label>
        <textarea
          id="steer"
          className="field field--dark"
          rows={2}
          value={steer}
          onChange={(e) => setSteer(e.target.value)}
          placeholder={t("steerPlaceholder")}
          disabled={forking || isDemo}
        />
        {err && <p className="hint hint--err">{err}</p>}
        {isDemo && <p className="caption" style={{ marginTop: 10 }}>{td("demo.readonly")}</p>}
        <div style={{ marginTop: 14 }}>
          {forking ? (
            <PixSpinner label={t("forking")} />
          ) : (
            <button className="btn" type="button" data-tour="fork" onClick={fork} disabled={isDemo}>
              <PixelIcon name="fork" size={16} color="#2B2118" /> {t("fork")}
            </button>
          )}
        </div>
        {!isDemo && !apiKey && (
          <p className="caption" style={{ marginTop: 12 }}>
            {t("passagesLeft", { count: quotaRemaining })}
          </p>
        )}
        {isDemo && (
          <div className="row center wrap gap-2" style={{ marginTop: 16 }}>
            <span className="label" style={{ margin: 0 }}>
              {td("demo.switchLabel")}
            </span>
            {LANGUAGES.map((l) => {
              const active = l.code === language;
              return (
                <button
                  key={l.code}
                  type="button"
                  className="chip"
                  aria-pressed={active}
                  disabled={active || switching}
                  onClick={() => switchLanguage(l.code)}
                  style={{ cursor: active || switching ? "default" : "pointer" }}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section data-tour="branches" style={{ marginTop: 26 }}>
        <h2 className="node-title" style={{ color: "var(--muted)", marginBottom: 12 }}>
          {t("branchesTitle")}
        </h2>
        {children.length === 0 ? (
          <p className="caption">{t("noBranches")}</p>
        ) : (
          <div className="row wrap gap-3">
            {children.map((child) => (
              <button
                key={child.id}
                type="button"
                className="frame frame--basalt story-card"
                onClick={() => onSelect(child.id)}
                style={{ textAlign: "left", padding: "12px 14px", maxWidth: 320, cursor: "pointer" }}
              >
                <span className="node-title" style={{ color: "var(--sand-light)", display: "block", marginBottom: 4 }}>
                  {child.title}
                </span>
                <span className="caption" style={{ display: "block" }}>
                  {child.summary}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {forking && <GeneratingStars />}
    </div>
  );
}
