import { stratify, tree } from "d3-hierarchy";
import { childrenOf, pathFromRoot, type TreeNode } from "./path";

// A node placed on the Atlas canvas. `onPath` marks membership of the current
// root→selected timeline; `childCount` drives the fork badge.
export type LaidOutNode = {
  id: string;
  x: number;
  y: number;
  depth: number;
  childCount: number;
  onPath: boolean;
};

export type LaidOutEdge = { parentId: string; childId: string; onPath: boolean };

export type AtlasLayout = {
  nodes: LaidOutNode[];
  edges: LaidOutEdge[];
  width: number;
  height: number;
};

export type LayoutOptions = {
  nodeWidth?: number;
  nodeHeight?: number;
  padding?: number;
};

// Tidy-tree layout (d3-hierarchy) for an adjacency list with a single root.
// Coordinates are normalized so the canvas starts at `padding` and every x ≥ 0,
// ready to drop straight into an SVG. Pure: rendering and interaction live elsewhere.
export function layoutTree(
  nodes: TreeNode[],
  selectedId: string,
  options: LayoutOptions = {},
): AtlasLayout {
  const nodeWidth = options.nodeWidth ?? 160;
  const nodeHeight = options.nodeHeight ?? 96;
  const padding = options.padding ?? 40;

  const root = stratify<TreeNode>()
    .id((n) => n.id)
    .parentId((n) => n.parentId ?? undefined)(nodes);

  const layoutRoot = tree<TreeNode>().nodeSize([nodeWidth, nodeHeight])(root);

  const placed = layoutRoot.descendants();
  const minX = Math.min(...placed.map((p) => p.x));
  const minY = Math.min(...placed.map((p) => p.y));
  const shiftX = padding - minX;
  const shiftY = padding - minY;

  const ids = new Set(nodes.map((n) => n.id));
  const pathSet = ids.has(selectedId)
    ? new Set(pathFromRoot(nodes, selectedId).map((n) => n.id))
    : new Set<string>();

  const laidOut: LaidOutNode[] = placed.map((p) => ({
    id: p.data.id,
    x: p.x + shiftX,
    y: p.y + shiftY,
    depth: p.depth,
    childCount: childrenOf(nodes, p.data.id).length,
    onPath: pathSet.has(p.data.id),
  }));

  const edges: LaidOutEdge[] = layoutRoot.links().map((link) => ({
    parentId: link.source.data.id,
    childId: link.target.data.id,
    onPath: pathSet.has(link.target.data.id),
  }));

  const maxX = Math.max(...laidOut.map((n) => n.x));
  const maxY = Math.max(...laidOut.map((n) => n.y));

  return {
    nodes: laidOut,
    edges,
    width: maxX + padding,
    height: maxY + padding,
  };
}
