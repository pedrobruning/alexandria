// A story as shown in the Archive grid. Counts are derived from its node tree.
export type StorySummary = {
  id: string;
  title: string;
  genre: string | null;
  tone: string | null;
  createdAt: string;
  passageCount: number;
  isDemo: boolean;
};

// A single passage in the reader. parentId === null marks the root.
export type StoryNode = {
  id: string;
  parentId: string | null;
  title: string;
  content: string;
  summary: string;
};

// One of the three sharing states a story can be in.
export type Visibility = "private" | "unlisted" | "public";

// A story plus its full node tree, for the reader view.
export type StoryDetail = {
  id: string;
  title: string;
  rootNodeId: string | null;
  isDemo: boolean;
  isOwner: boolean;
  visibility: Visibility;
  forkedFromStoryId: string | null;
  starCount: number;
  viewerStarred: boolean;
  language: string;
  nodes: StoryNode[];
};
