import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Wordmark } from "@/components/pixel/Wordmark";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";

export async function LandingFooter() {
  const t = await getTranslations("landing.footer");
  return (
    <footer className="landing-footer">
      <Wordmark size={30} light />
      <p className="landing-footer__tagline">{t("tagline")}</p>
      <Link href="/login" className="btn btn--lg">
        <PixelIcon name="scroll" size={18} color="#2B2118" /> {t("cta")}
      </Link>
      <LocaleSwitcher />
      <p className="landing-footer__rights">{t("rights")}</p>
    </footer>
  );
}
