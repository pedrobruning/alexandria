"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { PixSpinner } from "@/components/pixel/PixSpinner";
import { childrenOf, pathFromRoot } from "@/lib/tree/path";
import type { StoryNode } from "@/domains/stories/domain/types";

export function Reader({
  storyId,
  nodes,
  selectedId,
  onSelect,
}: {
  storyId: string;
  nodes: StoryNode[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations("reader");
  const router = useRouter();
  const [steer, setSteer] = useState("");
  const [forking, setForking] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Reset the steer box / error whenever the selection changes (from anywhere —
  // breadcrumb, child, or Atlas). React's render-time reset pattern.
  const [lastSelected, setLastSelected] = useState(selectedId);
  if (selectedId !== lastSelected) {
    setLastSelected(selectedId);
    setSteer("");
    setErr(null);
  }

  const trail = pathFromRoot(nodes, selectedId);
  const current = trail[trail.length - 1];
  const children = childrenOf(nodes, selectedId);

  async function fork() {
    setForking(true);
    setErr(null);
    try {
      const res = await fetch(`/api/stories/${storyId}/branch`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ parentId: selectedId, steer: steer.trim() || null }),
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
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
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

      <article className="frame frame--basalt" style={{ padding: "28px 30px 30px" }}>
        <h1 className="h2" style={{ color: "var(--sand-light)", marginBottom: 16 }}>
          {current.title}
        </h1>
        <div className="prose" style={{ color: "var(--sand-light)", maxWidth: "none" }}>
          {current.content.split(/\n{2,}/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </article>

      <section className="frame frame--basalt" style={{ marginTop: 22, padding: "20px 22px" }}>
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
          disabled={forking}
        />
        {err && <p className="hint hint--err">{err}</p>}
        <div style={{ marginTop: 14 }}>
          {forking ? (
            <PixSpinner label={t("forking")} />
          ) : (
            <button className="btn" type="button" onClick={fork}>
              <PixelIcon name="fork" size={16} color="#2B2118" /> {t("fork")}
            </button>
          )}
        </div>
      </section>

      <section style={{ marginTop: 26 }}>
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
    </div>
  );
}
