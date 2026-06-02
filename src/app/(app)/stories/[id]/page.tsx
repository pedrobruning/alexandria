import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getStory } from "@/domains/stories/infrastructure/supabaseStoryReader";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { Wordmark } from "@/components/pixel/Wordmark";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { StoryWorkspace } from "@/components/reader/StoryWorkspace";

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("reader");
  const supabase = await createClient();
  const story = await getStory(supabase, id);

  if (!story || !story.rootNodeId || story.nodes.length === 0) {
    notFound();
  }

  return (
    <div className="screen scroll-y" style={{ background: "var(--basalt)" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "rgba(43,33,24,.96)",
          borderBottom: "3px solid var(--stone)",
        }}
      >
        <div
          className="row center between wrap gap-3"
          style={{ maxWidth: 1120, margin: "0 auto", padding: "16px 28px" }}
        >
          <div className="row center gap-4">
            <Wordmark size={26} light />
            <Link className="chip" href="/stories">
              <PixelIcon name="back" size={14} color="var(--sand-light)" /> {t("backToArchive")}
            </Link>
          </div>
          <div className="row center gap-3">
            <span className="node-title" style={{ color: "var(--sand-light)" }}>
              {story.title}
            </span>
            <LocaleSwitcher />
            <SignOutButton />
          </div>
        </div>
      </header>

      <main style={{ padding: "32px 28px 80px" }}>
        <StoryWorkspace storyId={story.id} nodes={story.nodes} rootId={story.rootNodeId} />
      </main>
    </div>
  );
}
