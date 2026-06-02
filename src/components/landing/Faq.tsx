import { getTranslations } from "next-intl/server";
import { Reveal } from "./Reveal";

const ITEMS = ["public", "key", "languages", "oneshot"];

export async function Faq() {
  const t = await getTranslations("landing.faq");
  return (
    <section className="landing-section">
      <Reveal>
        <span className="landing-kicker">{t("kicker")}</span>
        <h2 className="landing-h2">{t("title")}</h2>
      </Reveal>
      <div className="landing-faq-list">
        {ITEMS.map((item, i) => (
          <Reveal key={item} delay={i * 70}>
            <div className="frame frame--basalt landing-faq-item">
              <p className="landing-faq-q">{t(`${item}Q`)}</p>
              <p className="landing-faq-a">{t(`${item}A`)}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
