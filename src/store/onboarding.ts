import { create } from "zustand";
import { nextStep, prevStep } from "@/domains/onboarding/domain/tour";

// Onboarding tour state. Deliberately NOT persisted: a refresh or a return
// visit must not resume a half-finished tour. Auto-start on first sign-in is
// driven by profiles.onboarded_at (server-side); replay is driven by the help
// button. Module-scoped, so it survives client-side navigation (archive → the
// demo reader) within the SPA.
type OnboardingState = {
  // `launching` covers the seed + cross-route navigation before the tour shows:
  // the launch veil reads it so the user never sees the bare archive flash by.
  launching: boolean;
  tourActive: boolean;
  stepIndex: number;
  beginLaunch: () => void;
  endLaunch: () => void;
  start: () => void;
  next: () => void;
  back: () => void;
  end: () => void;
};

export const useOnboarding = create<OnboardingState>((set) => ({
  launching: false,
  tourActive: false,
  stepIndex: 0,
  beginLaunch: () => set({ launching: true }),
  endLaunch: () => set({ launching: false }),
  start: () => set({ tourActive: true, stepIndex: 0 }),
  next: () => set((s) => ({ stepIndex: nextStep(s.stepIndex) })),
  back: () => set((s) => ({ stepIndex: prevStep(s.stepIndex) })),
  end: () => set({ tourActive: false, stepIndex: 0 }),
}));
