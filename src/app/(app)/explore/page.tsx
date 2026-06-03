import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getExploreStories } from "@/domains/stories/infrastructure/supabaseStoryReader";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { Wordmark } from "@/components/pixel/Wordmark";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { HeaderMenu } from "@/components/pixel/HeaderMenu";
import { ExploreCard } from "@/components/stories/ExploreCard";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const active = sort === "starred" ? "starred" : "recent";
  const t = await getTranslations("explore");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const stories = await getExploreStories(supabase, active);

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
              <span className="collapse-sm">{t("backToArchive")}</span>
            </Link>
          </div>
          <div className="row center wrap gap-3">
            <HeaderMenu>
              <LocaleSwitcher />
              <Link className="btn" href="/stories/new">
                <PixelIcon name="plus" size={16} color="#2B2118" /> {t("newStory")}
              </Link>
              <SignOutButton />
            </HeaderMenu>
          </div>
        </div>
      </header>

      <div className="app-content">
        <div className="row center between wrap gap-3" style={{ marginBottom: 18 }}>
          <span style={{ fontFamily: "var(--font-pixel)", fontSize: 18, color: "var(--sand-light)" }}>
            {t("title")}
          </span>
          <div className="row center gap-2">
            <Link
              href="/explore"
              className={active === "recent" ? "chip chip--on" : "chip"}
            >
              {t("sortRecent")}
            </Link>
            <Link
              href="/explore?sort=starred"
              className={active === "starred" ? "chip chip--on" : "chip"}
            >
              {t("sortStarred")}
            </Link>
          </div>
        </div>

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
                lineHeight: 1.6,
              }}
            >
              {t("emptyBody")}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,280px),1fr))",
              gap: 22,
            }}
          >
            {stories.map((s) => (
              <ExploreCard key={s.id} story={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
