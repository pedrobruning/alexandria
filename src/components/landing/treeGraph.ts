// Pure layout for the decorative branching-tree visual on the landing page.
// A full binary tree laid out top→down; coordinates are abstract units that the
// SVG scales via its viewBox. No I/O, no framework — unit-tested in tests/landing.

export type TreeNode = { id: number; x: number; y: number; depth: number; leaf: boolean };
export type TreeEdge = { from: number; to: number };
export type TreeGraph = {
  nodes: TreeNode[];
  edges: TreeEdge[];
  width: number;
  height: number;
  highlight: Set<number>;
};

const LEVEL_GAP = 100;
const LEAF_GAP = 100;

// Builds a full binary tree of the given depth (depth 0 = a single root).
// `highlight` marks the root→target-leaf path so the SVG can paint one
// "current timeline" in gold; the target leaf defaults to the most central one.
export function buildBranchTree(depth: number): TreeGraph {
  if (!Number.isInteger(depth) || depth < 0) {
    throw new Error("depth must be a non-negative integer");
  }

  const nodes: TreeNode[] = [];
  const edges: TreeEdge[] = [];
  const parentOf = new Map<number, number>();
  let nextId = 0;
  let leafCursor = 0;

  function build(d: number, parent: TreeNode | null): TreeNode {
    const node: TreeNode = { id: nextId++, x: 0, y: d * LEVEL_GAP, depth: d, leaf: d === depth };
    nodes.push(node);
    if (parent) {
      edges.push({ from: parent.id, to: node.id });
      parentOf.set(node.id, parent.id);
    }
    if (d === depth) {
      node.x = leafCursor++ * LEAF_GAP;
    } else {
      const left = build(d + 1, node);
      const right = build(d + 1, node);
      node.x = (left.x + right.x) / 2;
    }
    return node;
  }

  build(0, null);

  const width = nodes.reduce((max, n) => Math.max(max, n.x), 0);
  const height = depth * LEVEL_GAP;

  // Pick the leaf nearest the horizontal centre and walk up to the root.
  const leaves = nodes.filter((n) => n.leaf);
  const target = leaves.reduce((best, n) =>
    Math.abs(n.x - width / 2) < Math.abs(best.x - width / 2) ? n : best,
  );
  const highlight = new Set<number>();
  let cursor: number | undefined = target.id;
  while (cursor !== undefined) {
    highlight.add(cursor);
    cursor = parentOf.get(cursor);
  }

  return { nodes, edges, width, height, highlight };
}
