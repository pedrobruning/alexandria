"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PixelIcon } from "@/components/pixel/PixelIcon";

// Optimistic star toggle for a story the viewer doesn't own. Reverts on failure.
export function StarButton({
  storyId,
  initialStarred,
  initialCount,
}: {
  storyId: string;
  initialStarred: boolean;
  initialCount: number;
}) {
  const t = useTranslations("storyCard");
  const router = useRouter();
  const [starred, setStarred] = useState(initialStarred);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (pending) return;
    const next = !starred;
    setPending(true);
    setStarred(next);
    setCount((c) => c + (next ? 1 : -1));
    try {
      const res = await fetch(`/api/stories/${storyId}/star`, {
        method: next ? "POST" : "DELETE",
      });
      if (!res.ok) throw new Error("star failed");
      router.refresh();
    } catch {
      setStarred(!next);
      setCount((c) => c + (next ? -1 : 1));
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      className="chip"
      aria-pressed={starred}
      onClick={toggle}
      disabled={pending}
      style={{ cursor: pending ? "default" : "pointer" }}
    >
      <PixelIcon name="star" size={13} color={starred ? "var(--gold)" : "var(--muted)"} />{" "}
      {t("stars", { count })}
    </button>
  );
}
