import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { listStories } from "@/domains/stories/infrastructure/supabaseStoryReader";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { Wordmark } from "@/components/pixel/Wordmark";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { HeaderMenu } from "@/components/pixel/HeaderMenu";
import { StoryCard } from "@/components/stories/StoryCard";
import { HelpButton } from "@/components/onboarding/HelpButton";
import { OnboardingAutostart } from "@/components/onboarding/OnboardingAutostart";

export default async function StoriesPage() {
  const t = await getTranslations("archive");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("handle, onboarded_at")
    .eq("id", user.id)
    .single();

  const handle = profile?.handle ?? user.email?.split("@")[0] ?? t("archivist");
  const stories = await listStories(supabase);

  return (
    <div className="screen scroll-y" style={{ background: "var(--basalt)" }}>
      <OnboardingAutostart onboarded={!!profile?.onboarded_at} />
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
            <div
              className="frame frame--basalt collapse-sm"
              style={{ padding: "6px 14px" }}
            >
              <span
                style={{
                  fontFamily: "var(--font-pixel)",
                  fontWeight: 600,
                  fontSize: 15,
                  color: "var(--sand-light)",
                }}
              >
                {t("title")}
              </span>
            </div>
          </div>
          <div className="row center wrap gap-3">
            <span className="caption hide-sm">
              {t("archivist")} · <span style={{ color: "var(--lapis-bright)" }}>{handle}</span>
            </span>
            <HeaderMenu>
              <LocaleSwitcher />
              <HelpButton />
              <Link className="btn" href="/stories/new">
                <PixelIcon name="plus" size={16} color="#2B2118" /> {t("newStory")}
              </Link>
              <SignOutButton />
            </HeaderMenu>
          </div>
        </div>
      </header>

      <div className="app-content">
        {stories.length === 0 ? (
          <div className="center-col" style={{ textAlign: "center", padding: "8vh 20px" }}>
            <h2 className="h2" style={{ color: "var(--sand-light)", marginBottom: 12 }}>
              {t("emptyTitle")}
            </h2>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 17,
                color: "var(--muted)",
                maxWidth: "34ch",
                marginBottom: 26,
                lineHeight: 1.6,
              }}
            >
              {t("emptyBody")}
            </p>
            <Link className="btn btn--lg" href="/stories/new">
              <PixelIcon name="plus" size={18} color="#2B2118" /> {t("emptyCta")}
            </Link>
          </div>
        ) : (
          <>
            <div className="row center between" style={{ marginBottom: 18 }}>
              <span style={{ fontFamily: "var(--font-pixel)", fontSize: 18, color: "var(--sand-light)" }}>
                {t("count", { count: stories.length })}
              </span>
              <span className="caption">{t("sorted")}</span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,280px),1fr))",
                gap: 22,
              }}
            >
              {stories.map((s) => (
                <StoryCard key={s.id} story={s} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
