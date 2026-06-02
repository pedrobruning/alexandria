import { getTranslations } from "next-intl/server";
import { BranchTree } from "./BranchTree";
import { Reveal } from "./Reveal";

export async function TreeNotLine() {
  const t = await getTranslations("landing.tree");
  return (
    <section className="landing-section">
      <div className="landing-tree-grid">
        <Reveal>
          <span className="landing-kicker">{t("kicker")}</span>
          <h2 className="landing-h2">{t("title")}</h2>
          <p className="landing-lead">{t("body")}</p>
        </Reveal>
        <Reveal delay={120}>
          <figure>
            <div className="landing-tree-figure">
              <BranchTree depth={3} />
            </div>
            <figcaption className="landing-tree-cap">{t("caption")}</figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
