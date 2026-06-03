// Persists a star toggle. The Supabase adapter implements StarStore in
// infrastructure; tests inject a fake. RLS is the real authorization boundary
// (a star requires a visible, non-own story), but rejecting a self-star here
// gives the route a clean error instead of relying on an RLS insert failure.
export type StarStore = {
  add(userId: string, storyId: string): Promise<void>;
  remove(userId: string, storyId: string): Promise<void>;
};

export class SelfStarError extends Error {
  constructor() {
    super("a user cannot star their own story");
    this.name = "SelfStarError";
  }
}

export type ToggleStarInput = {
  userId: string;
  ownerId: string;
  storyId: string;
  starred: boolean;
  store: StarStore;
};

export async function toggleStar(input: ToggleStarInput): Promise<void> {
  if (input.ownerId === input.userId) throw new SelfStarError();
  if (input.starred) {
    await input.store.add(input.userId, input.storyId);
  } else {
    await input.store.remove(input.userId, input.storyId);
  }
}
