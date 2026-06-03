import { describe, it, expect } from "vitest";
import { remapTree, orderForInsert, type SourceNode } from "@/domains/stories/domain/fork";

function counter() {
  let n = 0;
  return () => `new-${++n}`;
}

const tree: SourceNode[] = [
  { id: "r", parentId: null, title: "Root", content: "c0", summary: "s0", steer: null, modelUsed: "m" },
  { id: "a", parentId: "r", title: "A", content: "c1", summary: "s1", steer: "go left", modelUsed: "m" },
  { id: "b", parentId: "r", title: "B", content: "c2", summary: "s2", steer: null, modelUsed: "m" },
  { id: "a1", parentId: "a", title: "A1", content: "c3", summary: "s3", steer: null, modelUsed: "m" },
];

describe("remapTree", () => {
  it("assigns fresh ids and remaps parent pointers onto them", () => {
    const { nodes, rootId, idMap } = remapTree(tree, counter());

    expect(rootId).toBe(idMap.get("r"));
    expect(nodes).toHaveLength(4);
    // every id is new, none collides with a source id
    expect(nodes.every((n) => n.id.startsWith("new-"))).toBe(true);
    // the root keeps a null parent
    expect(nodes.find((n) => n.id === idMap.get("r"))!.parentId).toBeNull();
    // A1's parent points at the remapped A, not the old id
    expect(nodes.find((n) => n.id === idMap.get("a1"))!.parentId).toBe(idMap.get("a"));
  });

  it("preserves the frozen prose and steer of each passage", () => {
    const { nodes, idMap } = remapTree(tree, counter());
    const a = nodes.find((n) => n.id === idMap.get("a"))!;
    expect(a).toMatchObject({ title: "A", content: "c1", summary: "s1", steer: "go left" });
  });
});

describe("orderForInsert", () => {
  it("orders every parent before its children", () => {
    const { nodes } = remapTree(tree, counter());
    const ordered = orderForInsert(nodes);
    const pos = new Map(ordered.map((n, i) => [n.id, i]));
    for (const n of ordered) {
      if (n.parentId !== null) {
        expect(pos.get(n.parentId)!).toBeLessThan(pos.get(n.id)!);
      }
    }
    expect(ordered).toHaveLength(4);
  });

  it("handles a single-node tree", () => {
    const single: SourceNode[] = [tree[0]];
    const { nodes } = remapTree(single, counter());
    expect(orderForInsert(nodes)).toHaveLength(1);
  });
});
