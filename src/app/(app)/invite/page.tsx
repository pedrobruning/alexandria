import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { Wordmark } from "@/components/pixel/Wordmark";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { HeaderMenu } from "@/components/pixel/HeaderMenu";
import { InviteLink } from "@/components/invite/InviteLink";
import { REFERRAL_REWARD_CREDITS, REFERRAL_QUALIFY_NODES } from "@/domains/referrals/domain/referrals";
import { appBaseUrl } from "@/lib/appUrl";

// The app's public origin. Prefer the configured base URL; fall back to the
// proxied request headers so invite links still resolve in local dev.
async function originFromHeaders(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export default async function InvitePage() {
  const t = await getTranslations("invite");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("referral_code, bonus_credits")
    .eq("id", user.id)
    .single();

  const { data: referrals } = await supabase
    .from("referrals")
    .select("status")
    .eq("referrer_id", user.id);

  const rows = referrals ?? [];
  const invited = rows.length;
  const qualified = rows.filter((r) => r.status === "rewarded").length;
  const capped = rows.filter((r) => r.status === "capped").length;

  const stats: { label: string; value: number }[] = [
    { label: t("statInvited"), value: invited },
    { label: t("statQualified"), value: qualified },
    { label: t("statCapped"), value: capped },
  ];

  return (
    <div className="screen scroll-y" style={{ background: "var(--basalt)" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "rgba(43,33,24,.96)",
          borderBottom: "3px solid var(--stone)",
          backdropFilter: "blur(2px)",
        }}
      >
        <div className="app-header__bar row center between wrap gap-3">
          <div className="row center wrap gap-3">
            <Wordmark size={26} light />
            <Link className="chip" href="/stories">
              <PixelIcon name="back" size={14} color="var(--sand-light)" />{" "}
              <span className="collapse-sm">{t("back")}</span>
            </Link>
          </div>
          <HeaderMenu>
            <LocaleSwitcher />
            <SignOutButton />
          </HeaderMenu>
        </div>
      </header>

      <div className="app-content" style={{ maxWidth: 640, margin: "0 auto" }}>
        <h1 className="h2" style={{ color: "var(--sand-light)", marginBottom: 10 }}>
          {t("title")}
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 17,
            color: "var(--muted)",
            lineHeight: 1.6,
            marginBottom: 26,
          }}
        >
          {t("intro", { reward: REFERRAL_REWARD_CREDITS, nodes: REFERRAL_QUALIFY_NODES })}
        </p>

        <div className="frame" style={{ padding: 18, marginBottom: 22 }}>
          <span className="label">{t("linkLabel")}</span>
          {profile?.referral_code ? (
            <InviteLink link={`${appBaseUrl(await originFromHeaders())}/r/${profile.referral_code}`} />
          ) : (
            <p className="caption">{t("noCode")}</p>
          )}
        </div>

        <div className="frame" style={{ padding: 18, marginBottom: 22 }}>
          <span className="label">{t("creditsLabel")}</span>
          <div className="row center gap-2" style={{ marginTop: 6 }}>
            <PixelIcon name="star" size={18} color="var(--gold)" />
            <span
              style={{
                fontFamily: "var(--font-pixel)",
                fontSize: 26,
                color: "var(--gold)",
              }}
            >
              {profile?.bonus_credits ?? 0}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,140px),1fr))",
            gap: 14,
          }}
        >
          {stats.map((s) => (
            <div key={s.label} className="frame frame--basalt" style={{ padding: 14, textAlign: "center" }}>
              <div
                style={{
                  fontFamily: "var(--font-pixel)",
                  fontSize: 24,
                  color: "var(--sand-light)",
                }}
              >
                {s.value}
              </div>
              <div className="caption" style={{ marginTop: 4 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
