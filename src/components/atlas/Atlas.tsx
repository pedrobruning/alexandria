"use client";

import { useTranslations } from "next-intl";
import { layoutTree } from "@/lib/tree/layout";
import type { StoryNode } from "@/domains/stories/domain/types";

const NODE_W = 132;
const NODE_H = 52;
const GAP_X = 28;
const GAP_Y = 56;

function truncate(text: string, max = 18): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

// Static tidy-tree render of the story. Highlights the current root→selected
// timeline and badges fork points with their child count. Interaction (click to
// select, pan, auto-center) lands in T10.
export function Atlas({ nodes, selectedId }: { nodes: StoryNode[]; selectedId: string }) {
  const t = useTranslations("atlas");
  const titles = new Map(nodes.map((n) => [n.id, n.title]));
  const layout = layoutTree(
    nodes.map((n) => ({ id: n.id, parentId: n.parentId })),
    selectedId,
    { nodeWidth: NODE_W + GAP_X, nodeHeight: NODE_H + GAP_Y },
  );
  const pos = new Map(layout.nodes.map((n) => [n.id, n]));
  const halfW = NODE_W / 2;
  const halfH = NODE_H / 2;

  return (
    <div className="frame frame--basalt" style={{ padding: 0, overflow: "auto", maxHeight: 340 }}>
      <svg
        role="img"
        aria-label={t("label")}
        width={layout.width}
        height={layout.height}
        style={{ display: "block", minWidth: "100%" }}
      >
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
            <g key={n.id} transform={`translate(${n.x - halfW}, ${n.y - halfH})`}>
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
                  fontSize: 12,
                  fill: n.onPath ? "var(--sand-light)" : "var(--muted)",
                }}
              >
                {truncate(titles.get(n.id) ?? "")}
              </text>
              {n.childCount >= 2 && (
                <g transform={`translate(${NODE_W - 8}, 8)`}>
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
      </svg>
    </div>
  );
}
