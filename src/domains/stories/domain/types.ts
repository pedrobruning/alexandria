// A story as shown in the Archive grid. Counts are derived from its node tree.
export type StorySummary = {
  id: string;
  title: string;
  genre: string | null;
  tone: string | null;
  createdAt: string;
  passageCount: number;
};

// A single passage in the reader. parentId === null marks the root.
export type StoryNode = {
  id: string;
  parentId: string | null;
  title: string;
  content: string;
  summary: string;
};

// A story plus its full node tree, for the reader view.
export type StoryDetail = {
  id: string;
  title: string;
  rootNodeId: string | null;
  nodes: StoryNode[];
};
