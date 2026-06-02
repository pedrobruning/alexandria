// Records that a user has finished (or skipped) the onboarding tour. We keep
// the *first* completion timestamp: replaying the tour later must not move it,
// so the use case reads before it writes. The adapter lives in infrastructure.
export type OnboardingWriter = {
  getOnboardedAt(userId: string): Promise<string | null>;
  setOnboardedAt(userId: string): Promise<void>;
};

export async function markOnboarded(writer: OnboardingWriter, userId: string): Promise<void> {
  const existing = await writer.getOnboardedAt(userId);
  if (existing) return;
  await writer.setOnboardedAt(userId);
}
