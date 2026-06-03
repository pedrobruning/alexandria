// Pure tree operations for forking a story into a full immutable copy.
// No I/O: id generation is injected so copies are deterministic in tests.

export type SourceNode = {
  id: string;
  parentId: string | null;
  title: string;
  content: string;
  summary: string;
  steer: string | null;
  modelUsed: string;
};

// A copied node carries fresh ids but the same frozen prose.
export type ForkedNode = SourceNode;

export type RemapResult = {
  nodes: ForkedNode[];
  rootId: string | null;
  idMap: Map<string, string>;
};

// Assign each source node a new id and remap parent pointers onto the new ids.
// The root is the node with no parent. `genId` is injected (crypto.randomUUID in
// production, a counter in tests) so the remap is pure and verifiable.
export function remapTree(nodes: SourceNode[], genId: () => string): RemapResult {
  const idMap = new Map<string, string>();
  for (const node of nodes) {
    idMap.set(node.id, genId());
  }

  let rootId: string | null = null;
  const remapped: ForkedNode[] = nodes.map((node) => {
    const id = idMap.get(node.id)!;
    if (node.parentId === null) rootId = id;
    return {
      id,
      parentId: node.parentId === null ? null : (idMap.get(node.parentId) ?? null),
      title: node.title,
      content: node.content,
      summary: node.summary,
      steer: node.steer,
      modelUsed: node.modelUsed,
    };
  });

  return { nodes: remapped, rootId, idMap };
}

// Order nodes so every parent precedes its children — required because the
// nodes self-FK is checked per row, so a child can't be inserted before its
// parent exists. Breadth-first from the roots. Orphans (parent not present)
// are appended last so nothing is silently dropped.
export function orderForInsert(nodes: ForkedNode[]): ForkedNode[] {
  const byParent = new Map<string | null, ForkedNode[]>();
  for (const node of nodes) {
    const key = node.parentId;
    const bucket = byParent.get(key);
    if (bucket) bucket.push(node);
    else byParent.set(key, [node]);
  }

  const ordered: ForkedNode[] = [];
  const seen = new Set<string>();
  const queue = [...(byParent.get(null) ?? [])];
  while (queue.length > 0) {
    const node = queue.shift()!;
    if (seen.has(node.id)) continue;
    seen.add(node.id);
    ordered.push(node);
    queue.push(...(byParent.get(node.id) ?? []));
  }

  for (const node of nodes) {
    if (!seen.has(node.id)) ordered.push(node);
  }

  return ordered;
}
