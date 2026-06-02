import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import type { StorySummary } from "@/domains/stories/domain/types";
import { genreKey, toneKey } from "@/domains/stories/domain/options";

export function StoryCard({ story }: { story: StorySummary }) {
  const t = useTranslations("storyCard");
  const tc = useTranslations("create");
  const format = useFormatter();
  const forks = Math.max(0, story.passageCount - 1);
  const gk = story.genre ? genreKey(story.genre) : null;
  const tk = story.tone ? toneKey(story.tone) : null;
  return (
    <Link
      href={`/stories/${story.id}`}
      className="frame frame--basalt story-card"
      style={{ display: "block", padding: "16px 18px 18px", textDecoration: "none" }}
    >
      <h3 className="node-title" style={{ fontSize: 19, color: "var(--sand-light)", marginBottom: 8 }}>
        {story.title}
      </h3>
      <div className="row gap-2 wrap" style={{ marginBottom: 12 }}>
        {story.genre && (
          <span className="tag tag--lapis">{gk ? tc(`genres.${gk}`) : story.genre}</span>
        )}
        {story.tone && <span className="tag tag--gold">{tk ? tc(`tones.${tk}`) : story.tone}</span>}
      </div>
      <div className="row center between">
        <div className="row center gap-3">
          <span className="caption">
            <PixelIcon
              name="scroll"
              size={12}
              color="var(--muted)"
              style={{ display: "inline-block", verticalAlign: "-2px", marginRight: 4 }}
            />
            {t("passages", { count: story.passageCount })}
          </span>
          <span className="caption">
            <PixelIcon
              name="fork"
              size={12}
              color="var(--muted)"
              style={{ display: "inline-block", verticalAlign: "-2px", marginRight: 4 }}
            />
            {t("forks", { count: forks })}
          </span>
        </div>
        <span className="caption">
          {t("updated", { when: format.relativeTime(new Date(story.createdAt)) })}
        </span>
      </div>
    </Link>
  );
}
