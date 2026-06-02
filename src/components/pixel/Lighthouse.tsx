import type { CSSProperties } from "react";

// The Alexandria mark: the pixel lighthouse on its lapis tile, mirroring
// public/favicon.svg exactly so the in-app logo matches the system icon. Pixels
// are [x, y, w, h, fill] on a 16×16 grid.
const TILE = "#2A6F97";
const PIXELS: [number, number, number, number, string][] = [
  [0, 0, 16, 1, "#3A8DBE"],
  [0, 0, 1, 16, "#3A8DBE"],
  [0, 15, 16, 1, "#1F5375"],
  [15, 0, 1, 16, "#1F5375"],
  [7, 0, 1, 1, "#E0A82E"],
  [8, 0, 1, 1, "#E0A82E"],
  [6, 1, 1, 1, "#E0A82E"],
  [7, 1, 1, 1, "#F5ECD2"],
  [8, 1, 1, 1, "#F5ECD2"],
  [9, 1, 1, 1, "#E0A82E"],
  [6, 2, 1, 1, "#E8D5A8"],
  [7, 2, 1, 1, "#E8D5A8"],
  [8, 2, 1, 1, "#E8D5A8"],
  [9, 2, 1, 1, "#E8D5A8"],
  [6, 3, 1, 1, "#E8D5A8"],
  [7, 3, 1, 1, "#1F5375"],
  [8, 3, 1, 1, "#1F5375"],
  [9, 3, 1, 1, "#E8D5A8"],
  [6, 4, 1, 1, "#E8D5A8"],
  [7, 4, 1, 1, "#E8D5A8"],
  [8, 4, 1, 1, "#E8D5A8"],
  [9, 4, 1, 1, "#C9A876"],
  [6, 5, 1, 1, "#E8D5A8"],
  [7, 5, 1, 1, "#E8D5A8"],
  [8, 5, 1, 1, "#E8D5A8"],
  [9, 5, 1, 1, "#C9A876"],
  [5, 6, 1, 1, "#E8D5A8"],
  [6, 6, 1, 1, "#E8D5A8"],
  [7, 6, 1, 1, "#E8D5A8"],
  [8, 6, 1, 1, "#E8D5A8"],
  [9, 6, 1, 1, "#E8D5A8"],
  [10, 6, 1, 1, "#C9A876"],
  [6, 7, 1, 1, "#E8D5A8"],
  [7, 7, 1, 1, "#E8D5A8"],
  [8, 7, 1, 1, "#E8D5A8"],
  [9, 7, 1, 1, "#C9A876"],
  [6, 8, 1, 1, "#E8D5A8"],
  [7, 8, 1, 1, "#E8D5A8"],
  [8, 8, 1, 1, "#E8D5A8"],
  [9, 8, 1, 1, "#C9A876"],
  [5, 9, 1, 1, "#E8D5A8"],
  [6, 9, 1, 1, "#E8D5A8"],
  [7, 9, 1, 1, "#E8D5A8"],
  [8, 9, 1, 1, "#E8D5A8"],
  [9, 9, 1, 1, "#E8D5A8"],
  [10, 9, 1, 1, "#C9A876"],
  [5, 10, 1, 1, "#E8D5A8"],
  [6, 10, 1, 1, "#E8D5A8"],
  [7, 10, 1, 1, "#E8D5A8"],
  [8, 10, 1, 1, "#E8D5A8"],
  [9, 10, 1, 1, "#E8D5A8"],
  [10, 10, 1, 1, "#C9A876"],
  [5, 11, 1, 1, "#E8D5A8"],
  [6, 11, 1, 1, "#E8D5A8"],
  [7, 11, 1, 1, "#E8D5A8"],
  [8, 11, 1, 1, "#E8D5A8"],
  [9, 11, 1, 1, "#E8D5A8"],
  [10, 11, 1, 1, "#C9A876"],
  [4, 12, 1, 1, "#E8D5A8"],
  [5, 12, 1, 1, "#E8D5A8"],
  [6, 12, 1, 1, "#E8D5A8"],
  [7, 12, 1, 1, "#E8D5A8"],
  [8, 12, 1, 1, "#E8D5A8"],
  [9, 12, 1, 1, "#E8D5A8"],
  [10, 12, 1, 1, "#E8D5A8"],
  [11, 12, 1, 1, "#C9A876"],
  [4, 13, 1, 1, "#E8D5A8"],
  [5, 13, 1, 1, "#E8D5A8"],
  [6, 13, 1, 1, "#E8D5A8"],
  [7, 13, 1, 1, "#1F5375"],
  [8, 13, 1, 1, "#1F5375"],
  [9, 13, 1, 1, "#E8D5A8"],
  [10, 13, 1, 1, "#E8D5A8"],
  [11, 13, 1, 1, "#C9A876"],
  [3, 14, 1, 1, "#E8D5A8"],
  [4, 14, 1, 1, "#E8D5A8"],
  [5, 14, 1, 1, "#E8D5A8"],
  [6, 14, 1, 1, "#E8D5A8"],
  [7, 14, 1, 1, "#E8D5A8"],
  [8, 14, 1, 1, "#E8D5A8"],
  [9, 14, 1, 1, "#E8D5A8"],
  [10, 14, 1, 1, "#E8D5A8"],
  [11, 14, 1, 1, "#E8D5A8"],
  [12, 14, 1, 1, "#C9A876"],
];

export function Lighthouse({ size = 32, style }: { size?: number; style?: CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      role="img"
      aria-label="Alexandria"
      style={{ imageRendering: "pixelated", display: "block", ...style }}
      shapeRendering="crispEdges"
    >
      <rect x="0" y="0" width="16" height="16" rx="2" fill={TILE} />
      {PIXELS.map(([x, y, w, h, fill], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={fill} />
      ))}
    </svg>
  );
}
