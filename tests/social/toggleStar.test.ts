import { describe, it, expect, vi } from "vitest";
import { toggleStar, SelfStarError, type StarStore } from "@/domains/social/application/toggleStar";

function fakeStore() {
  return {
    add: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
  } satisfies StarStore;
}

describe("toggleStar", () => {
  it("adds a star when starring another user's story", async () => {
    const store = fakeStore();
    await toggleStar({ userId: "u1", ownerId: "u2", storyId: "s1", starred: true, store });
    expect(store.add).toHaveBeenCalledWith("u1", "s1");
    expect(store.remove).not.toHaveBeenCalled();
  });

  it("removes a star when unstarring", async () => {
    const store = fakeStore();
    await toggleStar({ userId: "u1", ownerId: "u2", storyId: "s1", starred: false, store });
    expect(store.remove).toHaveBeenCalledWith("u1", "s1");
    expect(store.add).not.toHaveBeenCalled();
  });

  it("rejects starring your own story without touching the store", async () => {
    const store = fakeStore();
    await expect(
      toggleStar({ userId: "u1", ownerId: "u1", storyId: "s1", starred: true, store }),
    ).rejects.toBeInstanceOf(SelfStarError);
    expect(store.add).not.toHaveBeenCalled();
    expect(store.remove).not.toHaveBeenCalled();
  });
});
