"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { layoutTree } from "@/lib/tree/layout";
import { AtlasSky } from "@/components/atlas/AtlasSky";
import type { StoryNode } from "@/domains/stories/domain/types";

const NODE_W = 118;
const NODE_H = 46;
const GAP_X = 26;
const GAP_Y = 52;
const PAD = 28;

function truncate(text: string, max = 15): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

// Scrollable tidy-tree map of the story. Highlights the current root→selected
// timeline, badges fork points with their child count, and lets a click select
// any node (synced to the reader). Pans via scroll and auto-centers the
// selection — so a 100-passage, multi-branch tree stays navigable in the panel.
export function Atlas({
  nodes,
  selectedId,
  onSelect,
}: {
  nodes: StoryNode[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations("atlas");
  const scrollRef = useRef<HTMLDivElement>(null);

  const titles = new Map(nodes.map((n) => [n.id, n.title]));
  const layout = layoutTree(
    nodes.map((n) => ({ id: n.id, parentId: n.parentId })),
    selectedId,
    { nodeWidth: NODE_W + GAP_X, nodeHeight: NODE_H + GAP_Y },
  );

  // Reserve half a node box (plus padding) around the laid-out centers so no
  // box is clipped at the canvas edge — the cause of the earlier cutoff.
  const halfW = NODE_W / 2;
  const halfH = NODE_H / 2;
  const xs = layout.nodes.map((n) => n.x);
  const ys = layout.nodes.map((n) => n.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const offsetX = PAD + halfW - minX;
  const offsetY = PAD + halfH - minY;
  const width = maxX - minX + NODE_W + PAD * 2;
  const height = maxY - minY + NODE_H + PAD * 2;

  const pos = new Map(layout.nodes.map((n) => [n.id, n]));
  const selected = pos.get(selectedId);
  const targetX = selected ? selected.x + offsetX : 0;
  const targetY = selected ? selected.y + offsetY : 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({
      left: targetX - el.clientWidth / 2,
      top: targetY - el.clientHeight / 2,
      behavior: "smooth",
    });
  }, [targetX, targetY]);

  return (
    <div className="atlas-canvas relative h-full overflow-hidden">
      <AtlasSky />
      <div ref={scrollRef} className="atlas-scroll relative h-full overflow-auto">
        <div
          className="flex min-h-full min-w-full"
          style={{
            // `safe` keeps the tree centered when it fits, but falls back to
            // start-alignment when it overflows so every node stays reachable by
            // scrolling (plain `center` clips the start edge on small screens).
            alignItems: "safe center",
            justifyContent: "safe center",
          }}
        >
          <svg
            role="img"
            aria-label={t("label")}
            width={width}
            height={height}
            // Keep intrinsic size as a flex item: without this the SVG shrinks to
            // the scroll container's width, clipping off-screen nodes and killing
            // horizontal scroll on narrow (mobile) viewports.
            style={{ display: "block", flexShrink: 0 }}
          >
            <g transform={`translate(${offsetX}, ${offsetY})`}>
          {layout.edges.map((e) => {
            const p = pos.get(e.parentId)!;
            const c = pos.get(e.childId)!;
            const midY = (p.y + halfH + (c.y - halfH)) / 2;
            return (
              <path
                key={`${e.parentId}-${e.childId}`}
                d={`M ${p.x} ${p.y + halfH} V ${midY} H ${c.x} V ${c.y - halfH}`}
                fill="none"
                stroke={e.onPath ? "var(--lapis-bright)" : "var(--stone)"}
                strokeWidth={e.onPath ? 3 : 2}
              />
            );
          })}

          {layout.nodes.map((n) => {
            const isSelected = n.id === selectedId;
            const stroke = isSelected
              ? "var(--gold)"
              : n.onPath
                ? "var(--lapis-bright)"
                : "var(--stone)";
            return (
              <g
                key={n.id}
                transform={`translate(${n.x - halfW}, ${n.y - halfH})`}
                role="button"
                tabIndex={0}
                aria-current={isSelected ? "true" : undefined}
                onClick={() => onSelect(n.id)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    onSelect(n.id);
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  rx={4}
                  fill={n.onPath ? "var(--basalt-2)" : "var(--basalt)"}
                  stroke={stroke}
                  strokeWidth={isSelected ? 3 : 2}
                />
                <text
                  x={NODE_W / 2}
                  y={NODE_H / 2 + 4}
                  textAnchor="middle"
                  style={{
                    fontFamily: "var(--font-pixel)",
                    fontSize: 11,
                    fill: n.onPath ? "var(--sand-light)" : "var(--muted)",
                    pointerEvents: "none",
                  }}
                >
                  {truncate(titles.get(n.id) ?? "")}
                </text>
                {n.childCount >= 2 && (
                  <g transform={`translate(${NODE_W - 7}, 7)`} style={{ pointerEvents: "none" }}>
                    <circle r={9} fill="var(--gold)" stroke="var(--gold-deep)" strokeWidth={1.5} />
                    <text
                      textAnchor="middle"
                      y={4}
                      style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, fill: "var(--ink)" }}
                    >
                      {n.childCount}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
