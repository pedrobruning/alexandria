"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { childrenOf, pathFromRoot } from "@/lib/tree/path";
import type { StoryNode } from "@/domains/stories/domain/types";

export function Reader({ nodes, rootId }: { nodes: StoryNode[]; rootId: string }) {
  const t = useTranslations("reader");
  const [selectedId, setSelectedId] = useState(rootId);

  const trail = pathFromRoot(nodes, selectedId);
  const current = trail[trail.length - 1];
  const children = childrenOf(nodes, selectedId);

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
                onClick={() => setSelectedId(node.id)}
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
                onClick={() => setSelectedId(child.id)}
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
