"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { PixSpinner } from "@/components/pixel/PixSpinner";

// Forks a story into the caller's account and navigates to the new copy.
export function ForkButton({ storyId }: { storyId: string }) {
  const t = useTranslations("reader");
  const router = useRouter();
  const [forking, setForking] = useState(false);
  const [err, setErr] = useState(false);

  async function fork() {
    if (forking) return;
    setForking(true);
    setErr(false);
    try {
      const res = await fetch(`/api/stories/${storyId}/fork`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { storyId?: string };
      if (!res.ok || !data.storyId) throw new Error("fork failed");
      router.push(`/stories/${data.storyId}`);
    } catch {
      setErr(true);
      setForking(false);
    }
  }

  if (forking) return <PixSpinner label={t("forkingStory")} />;

  return (
    <>
      <button type="button" className="btn" onClick={fork}>
        <PixelIcon name="fork" size={16} color="#2B2118" /> {t("forkStory")}
      </button>
      {err && <p className="hint hint--err">{t("forkStoryFailed")}</p>}
    </>
  );
}
