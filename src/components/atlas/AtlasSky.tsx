// Ancient-Egyptian celestial backdrop for the Atlas: the tree of timelines is
// read as a star chart. A fixed night sky (it does not pan with the tree) holds
// scattered decan stars, two named constellations drawn in faint gold — Sah
// (Orion = Osiris) and Meskhetiu (the Bull's Foreleg / Big Dipper) — the bright
// star Sopdet (Sirius = Isis), and the arcing body of the sky-goddess Nut.

// Deterministic scatter so the field is stable across renders (no hydration drift).
const STARS = Array.from({ length: 56 }, (_, i) => {
  const a = Math.sin(i * 12.9898) * 43758.5453;
  const b = Math.sin(i * 78.233 + 1.3) * 12543.123;
  const fx = a - Math.floor(a);
  const fy = b - Math.floor(b);
  return {
    left: `${(fx * 100).toFixed(2)}%`,
    top: `${(fy * 100).toFixed(2)}%`,
    size: fx > 0.86 ? 3 : fx > 0.6 ? 2 : 1,
    delay: `${(fy * 4).toFixed(2)}s`,
  };
});

type Pt = [number, number];

// Normalised (0–100) constellation figures.
const SAH: Pt[] = [
  [16, 40], // head
  [11, 50],
  [22, 51], // shoulders
  [14, 58],
  [18, 60],
  [22, 62], // belt
  [11, 72],
  [24, 73], // feet
];
const SAH_LINES: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 5],
  [3, 4],
  [4, 5],
  [3, 6],
  [5, 7],
];

const MESKHETIU: Pt[] = [
  [70, 16],
  [76, 14],
  [82, 17],
  [80, 24],
  [73, 26], // bowl
  [86, 28],
  [90, 33], // handle
];
const MESKHETIU_LINES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 0],
  [3, 5],
  [5, 6],
];

const SOPDET: Pt = [52, 80];

function lines(pts: Pt[], links: [number, number][]) {
  return links.map(([a, b], i) => (
    <line
      key={i}
      x1={pts[a][0]}
      y1={pts[a][1]}
      x2={pts[b][0]}
      y2={pts[b][1]}
      className="constellation-line"
    />
  ));
}

// Constellation joints render as HTML square dots (not SVG circles) so the
// non-uniform chart stretch can't squash them into ellipses.
function dots(pts: Pt[]) {
  return pts.map(([x, y], i) => (
    <span key={i} className="constellation-dot" style={{ left: `${x}%`, top: `${y}%` }} />
  ));
}

export function AtlasSky() {
  return (
    <div className="atlas-sky" aria-hidden>
      <svg className="atlas-sky__chart" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* the body of Nut arcing over the heavens; lines only (stars are dots) */}
        <path d="M 3 34 Q 50 2 97 34" className="nut-arc" />
        {lines(SAH, SAH_LINES)}
        {lines(MESKHETIU, MESKHETIU_LINES)}
      </svg>

      {dots(SAH)}
      {dots(MESKHETIU)}
      {/* Sopdet — the herald star, brightest in the field */}
      <span className="sopdet" style={{ left: `${SOPDET[0]}%`, top: `${SOPDET[1]}%` }} />

      {STARS.map((s, i) => (
        <span
          key={i}
          className="atlas-star"
          style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay }}
        />
      ))}
    </div>
  );
}
