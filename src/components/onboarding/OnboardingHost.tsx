"use client";

import { useRouter } from "next/navigation";
import { useOnboarding } from "@/store/onboarding";
import { OnboardingTour } from "./OnboardingTour";

// Hosts the tour on the reader page (where its anchors live). Finishing routes
// the user to create their own story; skipping just closes it. Both stamp
// onboarded_at so neither the autostart nor a refresh re-triggers the tour.
export function OnboardingHost() {
  const router = useRouter();
  const end = useOnboarding((s) => s.end);

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
