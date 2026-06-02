import { describe, expect, it } from "vitest";
import { layoutTree } from "@/lib/tree/layout";
import type { TreeNode } from "@/lib/tree/path";

// root
// ├── a
// │   └── a1
// └── b
const nodes: TreeNode[] = [
  { id: "root", parentId: null },
  { id: "a", parentId: "root" },
  { id: "b", parentId: "root" },
  { id: "a1", parentId: "a" },
];

function byId(layout: ReturnType<typeof layoutTree>) {
  return new Map(layout.nodes.map((n) => [n.id, n]));
}

describe("layoutTree", () => {
  it("positions every node and connects every parent→child edge", () => {
    const layout = layoutTree(nodes, "a1");
    expect(layout.nodes).toHaveLength(4);
    expect(layout.edges).toHaveLength(3);

    const edgePairs = layout.edges.map((e) => `${e.parentId}->${e.childId}`).sort();
    expect(edgePairs).toEqual(["a->a1", "root->a", "root->b"]);
  });

  it("assigns depth by distance from the root and lays deeper nodes further down", () => {
    const map = byId(layoutTree(nodes, "a1"));
    expect(map.get("root")!.depth).toBe(0);
    expect(map.get("a")!.depth).toBe(1);
    expect(map.get("a1")!.depth).toBe(2);
    expect(map.get("root")!.y).toBeLessThan(map.get("a")!.y);
    expect(map.get("a")!.y).toBeLessThan(map.get("a1")!.y);
  });

  it("gives siblings distinct horizontal positions and keeps x non-negative", () => {
    const map = byId(layoutTree(nodes, "a1"));
    expect(map.get("a")!.x).not.toBe(map.get("b")!.x);
    for (const n of layoutTree(nodes, "a1").nodes) {
      expect(n.x).toBeGreaterThanOrEqual(0);
    }
  });

  it("marks the current root→selected path on nodes and edges", () => {
    const layout = layoutTree(nodes, "a1");
    const map = byId(layout);
    expect(map.get("root")!.onPath).toBe(true);
    expect(map.get("a")!.onPath).toBe(true);
    expect(map.get("a1")!.onPath).toBe(true);
    expect(map.get("b")!.onPath).toBe(false);

    const onPathEdges = layout.edges.filter((e) => e.onPath).map((e) => `${e.parentId}->${e.childId}`).sort();
    expect(onPathEdges).toEqual(["a->a1", "root->a"]);
  });

  it("re-highlights when a different node is selected", () => {
    const map = byId(layoutTree(nodes, "b"));
    expect(map.get("b")!.onPath).toBe(true);
    expect(map.get("a")!.onPath).toBe(false);
    expect(map.get("a1")!.onPath).toBe(false);
  });

  it("counts each node's direct children for fork badges", () => {
    const map = byId(layoutTree(nodes, "root"));
    expect(map.get("root")!.childCount).toBe(2);
    expect(map.get("a")!.childCount).toBe(1);
    expect(map.get("a1")!.childCount).toBe(0);
    expect(map.get("b")!.childCount).toBe(0);
  });

  it("highlights nothing when the selection is unknown, without throwing", () => {
    const layout = layoutTree(nodes, "ghost");
    expect(layout.nodes.every((n) => !n.onPath)).toBe(true);
    expect(layout.edges.every((e) => !e.onPath)).toBe(true);
  });

  it("reports a positive canvas size", () => {
    const layout = layoutTree(nodes, "a1");
    expect(layout.width).toBeGreaterThan(0);
    expect(layout.height).toBeGreaterThan(0);
  });
});
