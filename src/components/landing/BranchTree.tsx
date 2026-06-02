import { buildBranchTree } from "./treeGraph";

// Decorative SVG of a story branching into coexisting timelines. One root→leaf
// path is painted gold (the "current timeline"); the rest are faint. Purely
// visual — marked aria-hidden.
export function BranchTree({
  depth = 3,
  className,
}: {
  depth?: number;
  className?: string;
}) {
  const { nodes, edges, width, height, highlight } = buildBranchTree(depth);
  const pad = 28;
  const byId = new Map(nodes.map((n) => [n.id, n]));

  return (
    <svg
      className={className}
      viewBox={`${-pad} ${-pad} ${width + pad * 2} ${height + pad * 2}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      shapeRendering="crispEdges"
    >
      {edges.map((e, i) => {
        const a = byId.get(e.from)!;
        const b = byId.get(e.to)!;
        const on = highlight.has(e.from) && highlight.has(e.to);
        return (
          <line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={on ? "var(--gold)" : "var(--stone-light)"}
            strokeWidth={on ? 4 : 2.5}
            vectorEffect="non-scaling-stroke"
            opacity={on ? 0.95 : 0.5}
          />
        );
      })}
      {nodes.map((n) => {
        const on = highlight.has(n.id);
        const s = on ? 16 : 12;
        return (
          <rect
            key={n.id}
            x={n.x - s / 2}
            y={n.y - s / 2}
            width={s}
            height={s}
            fill={on ? "var(--gold)" : "var(--basalt-2)"}
            stroke={on ? "var(--gold-deep)" : "var(--stone)"}
            strokeWidth={3}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}
