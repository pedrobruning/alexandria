import type { CSSProperties } from "react";

const ICONS: Record<string, string[]> = {
  fork: ["3,1,2,2", "3,4,2,5", "7,4,2,5", "3,9,2,2", "7,9,2,2", "5,5,2,1", "3,5,4,1", "7,5,1,1"],
  share: ["8,1,3,3", "1,5,3,3", "8,8,3,3", "3,5,5,2", "3,3,5,2"],
  back: ["1,5,3,2", "3,3,2,6", "5,4,2,4", "7,5,4,2"],
  trash: ["3,1,6,2", "1,3,10,2", "3,5,1,6", "5,5,1,6", "7,5,1,6", "2,11,8,1"],
  gear: ["5,1,2,2", "5,9,2,2", "1,5,2,2", "9,5,2,2", "4,4,4,4", "2,2,2,2", "8,2,2,2", "2,8,2,2", "8,8,2,2"],
  plus: ["5,2,2,8", "2,5,8,2"],
  copy: ["2,2,6,6", "5,5,5,5"],
  link: ["2,4,4,1", "2,4,1,3", "2,7,4,1", "7,4,4,1", "10,4,1,3", "7,7,4,1", "5,5,3,2"],
  eye: ["4,2,4,1", "2,4,1,4", "10,4,1,4", "4,9,4,1", "3,3,1,1", "8,3,1,1", "3,8,1,1", "8,8,1,1", "5,4,3,4"],
  scroll: ["2,2,8,1", "2,2,1,8", "9,2,1,8", "2,9,8,1", "4,4,4,1", "4,6,4,1"],
  star: ["5,1,2,10", "1,5,10,2", "3,3,2,2", "7,3,2,2", "3,7,2,2", "7,7,2,2"],
  check: ["9,3,2,2", "7,5,2,2", "5,7,2,2", "3,5,2,2", "3,7,2,2", "5,9,2,2"],
  x: ["2,2,2,2", "4,4,2,2", "6,6,2,2", "8,8,2,2", "8,2,2,2", "6,4,2,2", "4,6,2,2", "2,8,2,2"],
  flask: ["4,1,4,2", "5,3,2,3", "3,6,6,5", "3,11,6,1", "4,8,4,2"],
};

export type IconName = keyof typeof ICONS;

export function PixelIcon({
  name,
  size = 18,
  color = "currentColor",
  style,
}: {
  name: IconName | string;
  size?: number;
  color?: string;
  style?: CSSProperties;
}) {
  const rects = ICONS[name] ?? [];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      style={{ imageRendering: "pixelated", display: "block", ...style }}
      shapeRendering="crispEdges"
    >
      {rects.map((r, i) => {
        const [x, y, w, h] = r.split(",").map(Number);
        return <rect key={i} x={x} y={y} width={w} height={h} fill={color} />;
      })}
    </svg>
  );
}
