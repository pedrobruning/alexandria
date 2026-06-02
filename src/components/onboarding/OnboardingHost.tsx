"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/store/onboarding";
import { OnboardingTour } from "./OnboardingTour";

// Hosts the tour on the reader page (where its anchors live). Finishing routes
// the user to create their own story; skipping just closes it. Both stamp
// onboarded_at so neither the autostart nor a refresh re-triggers the tour.
export function OnboardingHost() {
  const router = useRouter();
  const end = useOnboarding((s) => s.end);
  const tourActive = useOnboarding((s) => s.tourActive);
  const launching = useOnboarding((s) => s.launching);
  const endLaunch = useOnboarding((s) => s.endLaunch);

  // Drop the launch veil once we've landed on the reader with the tour active.
  // Two animation frames let <Spotlight> scroll-to + measure its first anchor
  // (a rAF-deferred step) so the veil lifts on an already-positioned card.
  useEffect(() => {
    if (!launching || !tourActive) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => endLaunch());
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [launching, tourActive, endLaunch]);

  async function complete() {
    await fetch("/api/onboarding/complete", { method: "POST" }).catch(() => {});
  }

  return (
    <OnboardingTour
      onFinish={async () => {
        end();
        await complete();
        router.push("/stories/new");
      }}
      onSkip={async () => {
        end();
        await complete();
      }}
    />
  );
}
