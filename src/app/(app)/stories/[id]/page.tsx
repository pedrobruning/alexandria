import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getStory } from "@/domains/stories/infrastructure/supabaseStoryReader";
import { countQuotaNodes } from "@/domains/quota/infrastructure/supabaseQuotaCounter";
import { remainingQuota } from "@/domains/quota/domain/quota";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { Wordmark } from "@/components/pixel/Wordmark";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { HeaderMenu } from "@/components/pixel/HeaderMenu";
import { StoryWorkspace } from "@/components/reader/StoryWorkspace";
import { HelpButton } from "@/components/onboarding/HelpButton";
import { OnboardingHost } from "@/components/onboarding/OnboardingHost";

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("reader");
  const supabase = await createClient();
  const story = await getStory(supabase, id);

  if (!story || !story.rootNodeId || story.nodes.length === 0) {
    notFound();
  }

  // Remaining branch allowance, re-read on every navigation (the reader calls
  // router.refresh() after a fork, so this stays current). The counter excludes
  // demo nodes, so this reflects the real allowance even on the demo story —
  // which is what the onboarding tour spotlights.
  let quotaRemaining = 0;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    quotaRemaining = remainingQuota(await countQuotaNodes(supabase, user.id));
  }

  return (
    <div className="screen scroll-y" style={{ background: "var(--basalt)" }}>
      <header
        className="app-header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "rgba(43,33,24,.96)",
          borderBottom: "3px solid var(--stone)",
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
            <span className="node-title hide-sm" style={{ color: "var(--sand-light)" }}>
              {story.title}
            </span>
            <HeaderMenu>
              <LocaleSwitcher />
              <HelpButton />
              <SignOutButton />
            </HeaderMenu>
          </div>
        </div>
      </header>

      <main className="app-main">
        <StoryWorkspace
          storyId={story.id}
          nodes={story.nodes}
          rootId={story.rootNodeId}
          isDemo={story.isDemo}
          language={story.language}
          quotaRemaining={quotaRemaining}
        />
        <OnboardingHost />
      </main>
    </div>
  );
}
