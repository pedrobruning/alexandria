"use client";

import { useTranslations } from "next-intl";
import { NightSky } from "@/components/pixel/NightSky";
import { useOnboarding } from "@/store/onboarding";

// Epic full-screen cover shown while the demo is seeded and the reader loads,
// so first-run users go straight from the archive into the tour without seeing
// the page swap. Mounted in the (app) layout so it survives the navigation.
export function TourLaunchVeil() {
  const launching = useOnboarding((s) => s.launching);
  const t = useTranslations("onboarding");
  if (!launching) return null;
  return (
    <NightSky
      messages={t.raw("loadingMessages") as string[]}
      sub={t("loadingSub")}
      className="gen-overlay--tour"
    />
  );
}
