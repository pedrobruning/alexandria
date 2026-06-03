// The guided onboarding tour as an ordered list of spotlight steps. Pure: the
// overlay component reads this and a step index from the (non-persisted) store.
// Each step but the last spotlights a real UI element via a [data-tour="…"]
// anchor; the final step is a centered card sending the user off to create
// their own story.

export type TourStepId = "branching" | "steer" | "atlas" | "quota" | "create";

export type Placement = "top" | "bottom" | "left" | "right" | "center";

export interface TourStep {
  id: TourStepId;
  anchor: string | null; // `[data-tour="…"]` selector, or null for a centered card
  placement: Placement;
}

export const TOUR_STEPS: readonly TourStep[] = [
  { id: "branching", anchor: '[data-tour="branches"]', placement: "top" },
  { id: "steer", anchor: '[data-tour="steer"]', placement: "top" },
  { id: "atlas", anchor: '[data-tour="atlas"]', placement: "bottom" },
  { id: "quota", anchor: '[data-tour="quota"]', placement: "top" },
  { id: "create", anchor: null, placement: "center" },
] as const;

export const nextStep = (i: number): number => Math.min(i + 1, TOUR_STEPS.length - 1);
export const prevStep = (i: number): number => Math.max(i - 1, 0);
export const isLastStep = (i: number): boolean => i === TOUR_STEPS.length - 1;
