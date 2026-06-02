import { describe, expect, it } from "vitest";
import {
  TOUR_STEPS,
  nextStep,
  prevStep,
  isLastStep,
} from "@/domains/onboarding/domain/tour";

describe("tour step machine", () => {
  it("orders the steps: branching → steer → atlas → quota → byok → create", () => {
    expect(TOUR_STEPS.map((s) => s.id)).toEqual([
      "branching",
      "steer",
      "atlas",
      "quota",
      "byok",
      "create",
    ]);
  });

  it("every non-final step anchors to a [data-tour=...] target; the final step is centered", () => {
    const last = TOUR_STEPS.length - 1;
    TOUR_STEPS.forEach((step, i) => {
      if (i === last) {
        expect(step.anchor).toBeNull();
        expect(step.placement).toBe("center");
      } else {
        expect(step.anchor).toMatch(/^\[data-tour="[a-z]+"\]$/);
      }
    });
  });

  it("advances and clamps at the last step", () => {
    expect(nextStep(0)).toBe(1);
    expect(nextStep(TOUR_STEPS.length - 1)).toBe(TOUR_STEPS.length - 1);
  });

  it("retreats and clamps at the first step", () => {
    expect(prevStep(3)).toBe(2);
    expect(prevStep(0)).toBe(0);
  });

  it("knows the last step", () => {
    expect(isLastStep(TOUR_STEPS.length - 1)).toBe(true);
    expect(isLastStep(0)).toBe(false);
  });
});
