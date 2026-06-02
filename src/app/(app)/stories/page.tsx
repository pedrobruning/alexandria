import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { listStories } from "@/domains/stories/infrastructure/supabaseStoryReader";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { Wordmark } from "@/components/pixel/Wordmark";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { StoryCard } from "@/components/stories/StoryCard";

export default async function StoriesPage() {
  const t = await getTranslations("archive");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("handle")
    .eq("id", user!.id)
    .single();

  const handle = profile?.handle ?? user!.email?.split("@")[0] ?? t("archivist");
  const stories = await listStories(supabase);

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
        <div
          className="row center between wrap gap-3"
          style={{ maxWidth: 1120, margin: "0 auto", padding: "16px 28px" }}
        >
          <div className="row center gap-4">
            <Wordmark size={26} light />
            <div
              className="frame frame--basalt"
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
          <div className="row center gap-3">
            <span className="caption">
              {t("archivist")} · <span style={{ color: "var(--lapis-bright)" }}>{handle}</span>
            </span>
            <LocaleSwitcher />
            <Link className="btn" href="/stories/new">
              <PixelIcon name="plus" size={16} color="#2B2118" /> {t("newStory")}
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "28px" }}>
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
                gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
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
