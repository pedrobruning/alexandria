import { describe, expect, it } from "vitest";
import { buildBranchTree } from "@/components/landing/treeGraph";

describe("buildBranchTree", () => {
  it("rejects a negative or non-integer depth", () => {
    expect(() => buildBranchTree(-1)).toThrow();
    expect(() => buildBranchTree(1.5)).toThrow();
  });

  it("a depth-0 tree is a single root leaf with no edges", () => {
    const t = buildBranchTree(0);
    expect(t.nodes).toHaveLength(1);
    expect(t.edges).toHaveLength(0);
    expect(t.nodes[0].leaf).toBe(true);
    expect(t.highlight.has(t.nodes[0].id)).toBe(true);
  });

  it("a full binary tree of depth d has 2^(d+1)-1 nodes and one fewer edge", () => {
    const t = buildBranchTree(3);
    expect(t.nodes).toHaveLength(15);
    expect(t.edges).toHaveLength(14);
    expect(t.nodes.filter((n) => n.leaf)).toHaveLength(8);
  });

  it("centres each parent over its two children", () => {
    const t = buildBranchTree(2);
    const root = t.nodes.find((n) => n.depth === 0)!;
    expect(root.x).toBe(t.width / 2);
  });

  it("highlights one continuous root→leaf path", () => {
    const t = buildBranchTree(3);
    // one node per depth level, 0..3 inclusive
    expect(t.highlight.size).toBe(4);
    const depths = [...t.highlight].map((id) => t.nodes.find((n) => n.id === id)!.depth).sort();
    expect(depths).toEqual([0, 1, 2, 3]);
  });
});
