"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { useOnboarding } from "@/store/onboarding";
import { TOUR_STEPS } from "@/domains/onboarding/domain/tour";

// The header's action cluster. On desktop the items sit inline as before; below
// 640px they collapse behind a hamburger so the passage gets the full viewport.
//
// The open menu is portalled to <body> and fixed-positioned under the toggle:
// the header lives inside .scroll-y (overflow-x: hidden) and, on the archive,
// carries a backdrop-filter — either would clip or re-anchor an absolutely
// positioned dropdown. (Same reason the Settings modal portals.)
//
// On mobile the inline copy is dropped from the DOM entirely, so the single
// [data-tour="settings"] anchor lives in the portal. The tour spotlights that
// button for two steps and blocks clicks, so those steps force the menu open.
export function HeaderMenu({ children }: { children: ReactNode }) {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [top, setTop] = useState<number | null>(null);

  const tourActive = useOnboarding((s) => s.tourActive);
  const stepIndex = useOnboarding((s) => s.stepIndex);
  const tourNeedsMenu =
    tourActive && TOUR_STEPS[stepIndex]?.anchor === '[data-tour="settings"]';

  const expanded = open || (isMobile && tourNeedsMenu);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Pin the panel to the viewport's right edge (CSS), only deriving its top from
  // the toggle — anchoring the right edge to the toggle's x breaks when the
  // header wraps and drops the hamburger to a left-aligned second row. Measured
  // before paint so the tour can find the settings button on the same commit.
  useLayoutEffect(() => {
    if (!isMobile || !expanded) return;
    const place = () => {
      const r = toggleRef.current?.getBoundingClientRect();
      if (r) setTop(r.bottom + 12);
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [isMobile, expanded]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  return (
    <div className="header-actions">
      <button
        ref={toggleRef}
        type="button"
        className="btn btn--ghost header-actions__toggle"
        aria-label={t("menu")}
        aria-haspopup="menu"
        aria-expanded={expanded}
        onClick={() => setOpen((v) => !v)}
      >
        <PixelIcon name={expanded ? "x" : "menu"} size={16} color="var(--gold)" />
      </button>

      {/* Inline cluster — desktop only. CSS also hides it pre-hydration on
          mobile so it never flashes before this client component mounts. */}
      {!isMobile && <div className="header-actions__items row center wrap gap-3">{children}</div>}

      {isMobile &&
        expanded &&
        top !== null &&
        createPortal(
          <div className="header-menu-pop" onClick={() => setOpen(false)}>
            <div
              className="header-actions__items header-menu-pop__panel col"
              style={{ top }}
              onClick={() => setOpen(false)}
            >
              {children}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
