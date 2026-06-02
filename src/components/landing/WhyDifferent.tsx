import { getTranslations } from "next-intl/server";
import { PixelIcon, type IconName } from "@/components/pixel/PixelIcon";
import { Reveal } from "./Reveal";

const POINTS: { key: string; icon: IconName }[] = [
  { key: "frozen", icon: "check" },
  { key: "byok", icon: "key" },
  { key: "yours", icon: "star" },
];

export async function WhyDifferent() {
  const t = await getTranslations("landing.why");
  return (
    <section className="landing-section">
      <Reveal>
        <span className="landing-kicker">{t("kicker")}</span>
        <h2 className="landing-h2">{t("title")}</h2>
      </Reveal>
      <div className="landing-cards landing-cards--3">
        {POINTS.map((point, i) => (
          <Reveal key={point.key} delay={i * 90}>
            <div className="frame frame--basalt landing-card">
              <div className="landing-card__icon">
                <PixelIcon name={point.icon} size={20} color="var(--lapis-bright)" />
              </div>
              <h3 className="landing-card__title">{t(`${point.key}Title`)}</h3>
              <p className="landing-card__body">{t(`${point.key}Body`)}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
