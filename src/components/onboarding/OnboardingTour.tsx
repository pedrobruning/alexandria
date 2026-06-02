"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { TOUR_STEPS, isLastStep } from "@/domains/onboarding/domain/tour";
import { useOnboarding } from "@/store/onboarding";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { Spotlight } from "./Spotlight";

// Drives the guided tour: reads the current step from the (non-persisted) store
// and renders its spotlight card. `onFinish` fires from the final step's CTA,
// `onSkip` from the Skip control or Escape — the host wires those to persist
// onboarded_at and route the user onward.
export function OnboardingTour({
  onFinish,
  onSkip,
}: {
  onFinish: () => void;
  onSkip: () => void;
}) {
  const t = useTranslations("onboarding");
  const active = useOnboarding((s) => s.tourActive);
  const stepIndex = useOnboarding((s) => s.stepIndex);
  const next = useOnboarding((s) => s.next);
  const back = useOnboarding((s) => s.back);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSkip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onSkip]);

  if (!active) return null;

  const step = TOUR_STEPS[stepIndex];
  const last = isLastStep(stepIndex);

  return (
    <Spotlight anchor={step.anchor} placement={step.placement}>
      <div className="tour-card__head">
        <span className="caption">
          {t("stepCount", { current: stepIndex + 1, total: TOUR_STEPS.length })}
        </span>
        <button type="button" className="chip" onClick={onSkip} style={{ cursor: "pointer" }}>
          {t("skip")}
        </button>
      </div>

      <h3 className="node-title" style={{ color: "var(--sand-light)", marginBottom: 8 }}>
        {t(`steps.${step.id}.title`)}
      </h3>
      <p className="tour-card__body">{t(`steps.${step.id}.body`)}</p>

      <div className="tour-card__controls">
        {stepIndex > 0 && (
          <button type="button" className="btn btn--ghost" onClick={back}>
            {t("back")}
          </button>
        )}
        <button type="button" className="btn" onClick={last ? onFinish : next}>
          {last ? (
            <>
              <PixelIcon name="plus" size={15} color="#2B2118" /> {t("finish")}
            </>
          ) : (
            t("next")
          )}
        </button>
      </div>
    </Spotlight>
  );
}
