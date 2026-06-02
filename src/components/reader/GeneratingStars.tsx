"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { PixSpinner } from "@/components/pixel/PixSpinner";

// Full-screen night sky shown while a new passage is being written. Stars
// twinkle endlessly and a line of evocative copy cycles, so the generation
// wait reads as "travelling the heavens to fetch the next timeline".

const STARS = Array.from({ length: 80 }, (_, i) => {
  const a = Math.sin(i * 12.9898) * 43758.5453;
  const b = Math.sin(i * 4.1414 + 0.7) * 24631.213;
  const fx = a - Math.floor(a);
  const fy = b - Math.floor(b);
  return {
    left: `${(fx * 100).toFixed(2)}%`,
    top: `${(fy * 100).toFixed(2)}%`,
    size: fx > 0.9 ? 3 : fx > 0.62 ? 2 : 1,
    dur: `${(2.2 + fy * 2.6).toFixed(2)}s`,
    delay: `${(fx * -3).toFixed(2)}s`,
  };
});

export function GeneratingStars() {
  const t = useTranslations("reader");
  const messages = t.raw("generatingMessages") as string[];
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % messages.length), 2300);
    return () => clearInterval(id);
  }, [messages.length]);

  return (
    <div className="gen-overlay" role="status" aria-live="polite">
      {STARS.map((s, k) => (
        <span
          key={k}
          className="gen-overlay__star"
          style={
            {
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              "--gd": s.dur,
              animationDelay: s.delay,
            } as CSSProperties
          }
        />
      ))}
      <div className="gen-card">
        <PixSpinner />
        <p className="gen-msg">{messages[i]}</p>
        <p className="gen-sub">{t("generatingSub")}</p>
      </div>
    </div>
  );
}
