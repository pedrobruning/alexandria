import { Lighthouse } from "./Lighthouse";

// "Alexandria" lockup — "Alex" in the base tone, "andria" in gold, capped by the
// lighthouse mark (the same art as the system favicon).
export function Wordmark({ size = 44, light }: { size?: number; light?: boolean }) {
  return (
    <div className="row center gap-3">
      <span
        className="logo"
        style={{
          fontSize: `clamp(20px, 6vw, ${size}px)`,
          color: light ? "var(--sand-light)" : "var(--ink)",
        }}
      >
        Alex<span style={{ color: "var(--gold)" }}>andria</span>
      </span>
      <Lighthouse size={Math.round(size * 0.92)} />
    </div>
  );
}
