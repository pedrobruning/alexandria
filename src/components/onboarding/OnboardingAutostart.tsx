"use client";

import { useEffect, useRef } from "react";
import { useDemoTour } from "./HelpButton";

// Fires the tour once for a user who has never onboarded. Server-gated on
// profiles.onboarded_at: completing or skipping the tour stamps it, so this
// stops auto-firing after the first run. A ref guards against React's
// double-invoke in development.
export function OnboardingAutostart({ onboarded }: { onboarded: boolean }) {
  const { launch } = useDemoTour();
  const fired = useRef(false);

  useEffect(() => {
    if (onboarded || fired.current) return;
    fired.current = true;
    launch();
  }, [onboarded, launch]);

  return null;
}
