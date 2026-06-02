import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";

// "DB is the cache": revisiting a frozen node is a pure SELECT — zero
// generation. These guards fail if a read path ever starts generating.

// Stub framework hooks + the animation children so we can render the Reader's
// read/navigation behavior in isolation.
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
vi.mock("@/components/reader/TimeVeil", () => ({ TimeVeil: () => null }));
vi.mock("@/components/reader/GeneratingStars", () => ({ GeneratingStars: () => null }));

import { Reader } from "@/components/reader/Reader";

const ROOT = "/Users/pedrosierrastudio/Projects/alexandria";
const src = (rel: string) => readFileSync(resolve(ROOT, rel), "utf8");

// Importing the generation TYPES is fine; invoking the generation RUNTIME from a
// read path is the regression we forbid.
const GENERATION_RUNTIME = /generatePassage|callOpenRouter|generation\/(application|infrastructure)/;

describe("frozen cache — static read-path guard", () => {
  const readPathFiles = [
    "src/domains/stories/infrastructure/supabaseStoryReader.ts",
    "src/app/(app)/stories/[id]/page.tsx",
    "src/components/reader/StoryWorkspace.tsx",
    // The demo story is seeded from canned content — never the model.
    "src/domains/stories/application/seedDemoStory.ts",
  ];

  it.each(readPathFiles)("%s never invokes the generation runtime", (file) => {
    expect(src(file)).not.toMatch(GENERATION_RUNTIME);
  });
});

describe("frozen cache — revisiting issues no generation request", () => {
  const nodes = [
    { id: "r", parentId: null, title: "Root", content: "Root text", summary: "root sum" },
    { id: "c1", parentId: "r", title: "Branch One", content: "c1 text", summary: "c1 sum" },
    { id: "c2", parentId: "r", title: "Branch Two", content: "c2 text", summary: "c2 sum" },
  ];

  beforeEach(() => {
    cleanup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ nodeId: "new" }),
    }) as unknown as typeof fetch;
  });

  it("selecting an existing child calls onSelect without fetching", () => {
    const onSelect = vi.fn();
    render(
      <Reader storyId="s1" nodes={nodes} selectedId="r" onSelect={onSelect} isDemo={false} language="en" quotaRemaining={20} />,
    );

    fireEvent.click(screen.getByText("Branch One"));

    expect(onSelect).toHaveBeenCalledWith("c1");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("forking — the write path — does hit the branch endpoint (guard discriminates)", async () => {
    render(
      <Reader storyId="s1" nodes={nodes} selectedId="r" onSelect={vi.fn()} isDemo={false} language="en" quotaRemaining={20} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "fork" }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/stories/s1/branch",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
