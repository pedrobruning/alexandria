import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Wordmark } from "@/components/pixel/Wordmark";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { AtlasSky } from "@/components/atlas/AtlasSky";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { BranchTree } from "./BranchTree";

export async function Hero() {
  const t = await getTranslations("landing.hero");
  return (
    <section className="landing-hero vignette">
      <AtlasSky />
      <BranchTree depth={3} className="landing-hero__tree" />

      <div className="landing-hero__top">
        <Wordmark size={26} light />
        <LocaleSwitcher />
      </div>

      <div className="landing-hero__inner">
        <span className="tag tag--lapis landing-beta">{t("beta")}</span>
        <h1 className="landing-hero__title">
          {t("headlineA")}{" "}
          <span className="landing-hero__title-gold">{t("headlineB")}</span>
        </h1>
        <p className="landing-hero__subhead">{t("subhead")}</p>
        <Link href="/login" className="btn btn--lg">
          <PixelIcon name="flask" size={18} color="#2B2118" /> {t("cta")}
        </Link>
        <div className="caption landing-hero__foot">{t("scroll")}</div>
      </div>
    </section>
  );
}
