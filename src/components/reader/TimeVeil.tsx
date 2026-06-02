import type { CSSProperties } from "react";

// The starfield that surges over a passage during a time jump (Nut's Veil).
// Bright cool-white pixel stars rush in and recede outward; a small Sah (Orion)
// figure ignites at the center as its lines draw, echoing the Atlas sky. Purely
// decorative, CSS-driven, mounted only while a jump is in flight.

const STARS = Array.from({ length: 40 }, (_, i) => {
  const a = Math.sin(i * 12.9898) * 43758.5453;
  const b = Math.sin(i * 78.233 + 2.1) * 12543.123;
  const x = (a - Math.floor(a)) * 100;
  const y = (b - Math.floor(b)) * 100;
  return {
    left: `${x.toFixed(2)}%`,
    top: `${y.toFixed(2)}%`,
    size: x > 72 ? 3 : x > 40 ? 2 : 1,
    vx: `${(((x - 50) / 50) * 90).toFixed(0)}px`,
    vy: `${(((y - 38) / 38) * 90).toFixed(0)}px`,
    delay: `${((a - Math.floor(a)) * 0.2).toFixed(3)}s`,
  };
});

// Sah / Orion, centred on the reveal origin (50, 38) in viewBox units.
const SAH: [number, number][] = [
  [44, 24],
  [56, 26], // shoulders
  [46, 36],
  [50, 38],
  [54, 40], // belt
  [43, 52],
  [57, 53], // feet
];
const SAH_LINES: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 4],
  [2, 3],
  [3, 4],
  [2, 5],
  [4, 6],
];

function starStyle(s: (typeof STARS)[number]): CSSProperties {
  return {
    left: s.left,
    top: s.top,
    width: s.size,
    height: s.size,
    "--vx": s.vx,
    "--vy": s.vy,
    animationDelay: s.delay,
  } as CSSProperties;
}

export function TimeVeil() {
  return (
    <div className="veil" aria-hidden>
      <span className="veil__flash" />
      <svg className="veil__lines" viewBox="0 0 100 100" preserveAspectRatio="none">
        {SAH_LINES.map(([a, b], i) => (
          <line
            key={i}
            x1={SAH[a][0]}
            y1={SAH[a][1]}
            x2={SAH[b][0]}
            y2={SAH[b][1]}
            pathLength={1}
            strokeDasharray={1}
            className="veil-line"
            style={{ animationDelay: `${(0.2 + i * 0.04).toFixed(2)}s` }}
          />
        ))}
      </svg>

      {STARS.map((s, i) => (
        <span key={i} className="veil-star" style={starStyle(s)} />
      ))}
      {/* the figure's own joints, slightly brighter, lit with the lines */}
      {SAH.map(([x, y], i) => (
        <span
          key={`sah-${i}`}
          className="veil-star"
          style={{ left: `${x}%`, top: `${y}%`, width: 3, height: 3, animationDelay: "0.3s" } as CSSProperties}
        />
      ))}
    </div>
  );
}
