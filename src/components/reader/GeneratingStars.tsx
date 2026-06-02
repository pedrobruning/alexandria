"use client";

import { useTranslations } from "next-intl";
import { NightSky } from "@/components/pixel/NightSky";

// Shown while a new passage is being written: the generation wait reads as
// "travelling the heavens to fetch the next timeline".
export function GeneratingStars() {
  const t = useTranslations("reader");
  return (
    <NightSky messages={t.raw("generatingMessages") as string[]} sub={t("generatingSub")} />
  );
}
