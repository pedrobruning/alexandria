import { describe, expect, it } from "vitest";
import { childrenOf, pathFromRoot, type TreeNode } from "@/lib/tree/path";

// Adjacency list for a small tree:
//   root
//   ├── a
//   │   └── a1
//   └── b
const nodes: TreeNode[] = [
  { id: "root", parentId: null },
  { id: "a", parentId: "root" },
  { id: "b", parentId: "root" },
  { id: "a1", parentId: "a" },
];

describe("pathFromRoot", () => {
  it("returns the ordered root→node path, inclusive", () => {
    expect(pathFromRoot(nodes, "a1").map((n) => n.id)).toEqual(["root", "a", "a1"]);
  });

  it("returns just the root for the root node", () => {
    expect(pathFromRoot(nodes, "root").map((n) => n.id)).toEqual(["root"]);
  });

  it("throws when the node is not present", () => {
    expect(() => pathFromRoot(nodes, "missing")).toThrow(/not found/);
  });

  it("throws when an ancestor reference is dangling", () => {
    const broken: TreeNode[] = [{ id: "orphan", parentId: "ghost" }];
    expect(() => pathFromRoot(broken, "orphan")).toThrow(/not found/);
  });

  it("throws on a parent cycle instead of looping forever", () => {
    const cyclic: TreeNode[] = [
      { id: "x", parentId: "y" },
      { id: "y", parentId: "x" },
    ];
    expect(() => pathFromRoot(cyclic, "x")).toThrow(/cycle/);
  });
});

describe("childrenOf", () => {
  it("returns direct children in input order", () => {
    expect(childrenOf(nodes, "root").map((n) => n.id)).toEqual(["a", "b"]);
  });

  it("returns an empty array for a leaf", () => {
    expect(childrenOf(nodes, "a1")).toEqual([]);
  });

  it("preserves the full node objects, not just ids", () => {
    expect(childrenOf(nodes, "a")).toEqual([{ id: "a1", parentId: "a" }]);
  });
});
