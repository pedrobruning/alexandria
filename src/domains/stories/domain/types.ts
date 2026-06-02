// A story as shown in the Archive grid. Counts are derived from its node tree.
export type StorySummary = {
  id: string;
  title: string;
  genre: string | null;
  tone: string | null;
  createdAt: string;
  passageCount: number;
};
