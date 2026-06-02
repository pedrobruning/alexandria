"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { useOnboarding } from "@/store/onboarding";

// Ensures the read-only demo story exists (seeded in the current UI locale on
// first run, returned untouched after), routes to its reader, and starts the
// tour. The tour store is module-scoped, so it survives the client-side nav and
// the reader's <OnboardingHost> renders the spotlight once its anchors mount.
export function useDemoTour() {
  const router = useRouter();
  const locale = useLocale();
  const start = useOnboarding((s) => s.start);
  const [pending, setPending] = useState(false);

  async function launch() {
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch("/api/onboarding/demo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const data = (await res.json().catch(() => ({}))) as { storyId?: string };
      if (data.storyId) {
        router.push(`/stories/${data.storyId}`);
        start();
      }
    } finally {
      setPending(false);
    }
  }

  return { launch, pending };
}

export function HelpButton() {
  const t = useTranslations("onboarding");
  const { launch, pending } = useDemoTour();
  return (
    <button
      type="button"
      className="btn btn--ghost row center gap-2"
      onClick={launch}
      disabled={pending}
      aria-label={t("helpAria")}
    >
      <PixelIcon name="help" size={15} color="var(--gold)" />
      <span className="hide-sm">{t("help")}</span>
    </button>
  );
}
