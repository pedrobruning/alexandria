import { getTranslations } from "next-intl/server";
import { PixelIcon, type IconName } from "@/components/pixel/PixelIcon";
import { Reveal } from "./Reveal";

const STEPS: { key: string; icon: IconName }[] = [
  { key: "spark", icon: "flask" },
  { key: "read", icon: "scroll" },
  { key: "fork", icon: "fork" },
  { key: "revisit", icon: "eye" },
];

export async function HowItWorks() {
  const t = await getTranslations("landing.how");
  return (
    <section className="landing-section">
      <Reveal>
        <span className="landing-kicker">{t("kicker")}</span>
        <h2 className="landing-h2">{t("title")}</h2>
      </Reveal>
      <div className="landing-cards landing-cards--4">
        {STEPS.map((step, i) => (
          <Reveal key={step.key} delay={i * 90}>
            <div className="frame frame--basalt landing-card">
              <div className="landing-card__icon">
                <PixelIcon name={step.icon} size={20} color="var(--gold)" />
              </div>
              <span className="landing-card__step">{`0${i + 1}`}</span>
              <h3 className="landing-card__title">{t(`${step.key}Title`)}</h3>
              <p className="landing-card__body">{t(`${step.key}Body`)}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
