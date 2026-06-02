// Pure adjacency-list helpers for the node tree. The reader derives its
// breadcrumb (root→node path) and child-branch list from these.

export type TreeNode = { id: string; parentId: string | null };

// Ordered root→node path, inclusive. Throws if the node or any ancestor is
// missing, or if the parent chain cycles (so a corrupt tree fails loudly
// instead of looping forever).
export function pathFromRoot<T extends TreeNode>(nodes: T[], nodeId: string): T[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const path: T[] = [];
  const seen = new Set<string>();

  let current = byId.get(nodeId);
  if (!current) throw new Error(`pathFromRoot: node "${nodeId}" not found`);

  while (current) {
    if (seen.has(current.id)) {
      throw new Error(`pathFromRoot: parent cycle detected at "${current.id}"`);
    }
    seen.add(current.id);
    path.push(current);

    if (current.parentId === null) break;
    const parent = byId.get(current.parentId);
    if (!parent) throw new Error(`pathFromRoot: parent "${current.parentId}" not found`);
    current = parent;
  }

  return path.reverse();
}

// Direct children of a node (or roots when parentId is null), input order preserved.
export function childrenOf<T extends TreeNode>(nodes: T[], parentId: string | null): T[] {
  return nodes.filter((n) => n.parentId === parentId);
}
