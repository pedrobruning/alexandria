"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AtlasModal } from "@/components/atlas/AtlasModal";
import { Reader } from "@/components/reader/Reader";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import type { StoryNode } from "@/domains/stories/domain/types";

// Owns the selected-node state shared between the Atlas (opened as a modal) and
// the Reader. Navigating anywhere — a breadcrumb, a child branch, or an Atlas
// node — drives `selectedId`, which the Reader animates as a time jump.
export function StoryWorkspace({
  storyId,
  nodes,
  rootId,
  isDemo,
  language,
  quotaRemaining,
}: {
  storyId: string;
  nodes: StoryNode[];
  rootId: string;
  isDemo: boolean;
  language: string;
  quotaRemaining: number;
}) {
  const t = useTranslations("atlas");
  const [selectedId, setSelectedId] = useState(rootId);
  const [atlasOpen, setAtlasOpen] = useState(false);

  // After a fork adds nodes, the previous selection still exists; if it somehow
  // doesn't (e.g. stale), fall back to the root so the reader never breaks.
  const exists = nodes.some((n) => n.id === selectedId);
  const activeId = exists ? selectedId : rootId;

  function travel(id: string) {
    setSelectedId(id);
    setAtlasOpen(false);
  }

  return (
    <>
      <Reader
        storyId={storyId}
        nodes={nodes}
        selectedId={activeId}
        onSelect={travel}
        isDemo={isDemo}
        language={language}
        quotaRemaining={quotaRemaining}
      />

      <button
        type="button"
        className="atlas-fab"
        data-tour="atlas"
        onClick={() => setAtlasOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={atlasOpen}
      >
        <PixelIcon name="fork" size={16} color="var(--ink)" /> {t("open")}
      </button>

      {atlasOpen && (
        <AtlasModal
          nodes={nodes}
          selectedId={activeId}
          onSelect={travel}
          onClose={() => setAtlasOpen(false)}
        />
      )}
    </>
  );
}
