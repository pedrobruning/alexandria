"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Atlas } from "@/components/atlas/Atlas";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import type { StoryNode } from "@/domains/stories/domain/types";

// Atlas presented as a pixel-framed modal overlay. Picking a node selects it
// and closes the modal, handing control back to the reader's time-jump.
export function AtlasModal({
  nodes,
  selectedId,
  onSelect,
  onClose,
}: {
  nodes: StoryNode[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const t = useTranslations("atlas");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="atlas-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
      onClick={onClose}
    >
      <div className="atlas-modal" onClick={(e) => e.stopPropagation()}>
        <div className="atlas-modal__bar">
          <span className="node-title" style={{ color: "var(--sand-light)" }}>
            {t("title")}
          </span>
          <button
            type="button"
            className="chip"
            aria-label={t("close")}
            onClick={onClose}
            style={{ cursor: "pointer" }}
          >
            <PixelIcon name="x" size={14} color="var(--sand-light)" />
          </button>
        </div>
        <div className="atlas-modal__body">
          <Atlas nodes={nodes} selectedId={selectedId} onSelect={onSelect} />
        </div>
      </div>
    </div>
  );
}
