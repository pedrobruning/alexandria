import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listStories } from "@/domains/stories/infrastructure/supabaseStoryReader";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Wordmark } from "@/components/pixel/Wordmark";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { StoryCard } from "@/components/stories/StoryCard";

export default async function StoriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("handle")
    .eq("id", user!.id)
    .single();

  const handle = profile?.handle ?? user!.email?.split("@")[0] ?? "archivist";
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
                The Archive
              </span>
            </div>
          </div>
          <div className="row center gap-3">
            <span className="caption">
              archivist · <span style={{ color: "var(--lapis-bright)" }}>{handle}</span>
            </span>
            <Link className="btn" href="/stories/new">
              <PixelIcon name="plus" size={16} color="#2B2118" /> New story
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "28px" }}>
        {stories.length === 0 ? (
          <div className="center-col" style={{ textAlign: "center", padding: "8vh 20px" }}>
            <h2 className="h2" style={{ color: "var(--sand-light)", marginBottom: 12 }}>
              The archive is empty.
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
              Every dig begins with a single sealed scroll. Unearth your first tale and watch its
              timelines branch.
            </p>
            <Link className="btn btn--lg" href="/stories/new">
              <PixelIcon name="plus" size={18} color="#2B2118" /> Unearth your first tale
            </Link>
          </div>
        ) : (
          <>
            <div className="row center between" style={{ marginBottom: 18 }}>
              <span style={{ fontFamily: "var(--font-pixel)", fontSize: 18, color: "var(--sand-light)" }}>
                {stories.length} {stories.length === 1 ? "excavation" : "excavations"}
              </span>
              <span className="caption">sorted · most recent</span>
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
