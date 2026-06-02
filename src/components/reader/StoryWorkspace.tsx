"use client";

import { useState } from "react";
import { Atlas } from "@/components/atlas/Atlas";
import { Reader } from "@/components/reader/Reader";
import type { StoryNode } from "@/domains/stories/domain/types";

// Owns the selected-node state shared between the Atlas (side panel) and the
// Reader (main column). Both read `selectedId` and drive it through `onSelect`,
// so clicking a node, a breadcrumb, or a child branch stays in sync.
export function StoryWorkspace({
  storyId,
  nodes,
  rootId,
}: {
  storyId: string;
  nodes: StoryNode[];
  rootId: string;
}) {
  const [selectedId, setSelectedId] = useState(rootId);

  // After a fork adds nodes, the previous selection still exists; if it somehow
  // doesn't (e.g. stale), fall back to the root so the reader never breaks.
  const exists = nodes.some((n) => n.id === selectedId);
  const activeId = exists ? selectedId : rootId;

  return (
    <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
      <aside
        style={{
          width: 340,
          flexShrink: 0,
          borderRight: "3px solid var(--stone)",
          minHeight: 0,
        }}
      >
        <Atlas nodes={nodes} selectedId={activeId} onSelect={setSelectedId} />
      </aside>
      <main className="scroll-y" style={{ flex: 1, minWidth: 0 }}>
        <div style={{ padding: "32px 28px 64px" }}>
          <Reader
            storyId={storyId}
            nodes={nodes}
            selectedId={activeId}
            onSelect={setSelectedId}
          />
        </div>
      </main>
    </div>
  );
}
