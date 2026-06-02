"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Placement } from "@/domains/onboarding/domain/tour";

type Rect = { top: number; left: number; width: number; height: number };

const GAP = 14; // distance between the spotlight hole and the card
const PAD = 6; // padding of the hole around the anchored element
const MARGIN = 16; // min gap between the card and the viewport edges

// A hand-built spotlight: a transparent, click-blocking overlay with a bordered
// "hole" cut around the anchored element (via a huge box-shadow scrim) and a
// pixel card placed beside it. With no anchor, it dims the whole screen and
// centres the card. Recomputes on scroll/resize; portals to <body> so the
// header's backdrop-filter can't trap it.
export function Spotlight({
  anchor,
  placement,
  children,
}: {
  anchor: string | null;
  placement: Placement;
  children: React.ReactNode;
}) {
  const [rect, setRect] = useState<Rect | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const measure = useCallback(() => {
    if (!anchor) return setRect(null);
    const el = document.querySelector(anchor);
    if (!el) return setRect(null);
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [anchor]);

  // Bring the target into view, then measure, whenever the step changes.
  useLayoutEffect(() => {
    if (anchor) {
      document.querySelector(anchor)?.scrollIntoView({ block: "center", inline: "center" });
    }
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, [anchor, measure]);

  // Keep the hole aligned as the page scrolls or resizes.
  useEffect(() => {
    if (!anchor) return;
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [anchor, measure]);

  // Place the card relative to the measured anchor (or centre it when none),
  // flipping/clamping so it always stays on screen.
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const cw = card.offsetWidth;
    const ch = card.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (!rect) {
      setPos({ top: Math.round((vh - ch) / 2), left: Math.round((vw - cw) / 2) });
      return;
    }

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const fitsBelow = rect.top + rect.height + GAP + ch + MARGIN <= vh;
    const fitsRight = rect.left + rect.width + GAP + cw + MARGIN <= vw;
    const fitsLeft = rect.left - GAP - cw - MARGIN >= 0;

    let top: number;
    let left: number;
    if (placement === "right" && fitsRight) {
      left = rect.left + rect.width + GAP;
      top = cy - ch / 2;
    } else if (placement === "left" && fitsLeft) {
      left = rect.left - GAP - cw;
      top = cy - ch / 2;
    } else if (placement === "top" && !fitsBelow) {
      left = cx - cw / 2;
      top = rect.top - GAP - ch;
    } else if (fitsBelow) {
      left = cx - cw / 2;
      top = rect.top + rect.height + GAP;
    } else {
      left = cx - cw / 2;
      top = rect.top - GAP - ch;
    }

    left = Math.max(MARGIN, Math.min(left, vw - cw - MARGIN));
    top = Math.max(MARGIN, Math.min(top, vh - ch - MARGIN));
    setPos({ top: Math.round(top), left: Math.round(left) });
  }, [rect, placement, children]);

  return createPortal(
    <div className="tour-overlay" role="dialog" aria-modal="true">
      {rect ? (
        <div
          className="tour-hole"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
          }}
        />
      ) : (
        <div className="tour-scrim" />
      )}
      <div
        ref={cardRef}
        className="tour-card"
        style={pos ? { top: pos.top, left: pos.left } : { opacity: 0, top: 0, left: 0 }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
