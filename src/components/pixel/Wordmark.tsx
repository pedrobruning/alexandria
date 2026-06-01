import { PixelIcon } from "./PixelIcon";

// "Alexandria" lockup — "Alex" in the base tone, "andria" in gold, with a fork glyph.
export function Wordmark({ size = 44, light }: { size?: number; light?: boolean }) {
  return (
    <div className="row center gap-3">
      <span className="logo" style={{ fontSize: size, color: light ? "var(--sand-light)" : "var(--ink)" }}>
        Alex<span style={{ color: "var(--gold)" }}>andria</span>
      </span>
      <PixelIcon name="fork" size={size * 0.7} color="var(--lapis-bright)" style={{ marginTop: 4 }} />
    </div>
  );
}
