import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { seedDemoStory } from "@/domains/stories/application/seedDemoStory";
import { supabaseDemoWriter } from "@/domains/stories/infrastructure/supabaseStoryWriter";
import { findDemoStory } from "@/domains/stories/infrastructure/supabaseStoryReader";
import { DEFAULT_LANGUAGE, isLanguageCode } from "@/domains/generation/domain/language";

export const runtime = "nodejs";

type Body = { locale?: unknown; replace?: unknown };

// Seeds (or re-seeds) the read-only onboarding demo story for the signed-in
// user. `replace` swaps the demo's language by dropping and re-seeding; without
// it the call is idempotent — an existing demo is returned untouched, so the
// first-sign-in trigger can fire it freely.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const locale = isLanguageCode(body.locale) ? body.locale : DEFAULT_LANGUAGE;
  const replace = body.replace === true;

  if (!replace) {
    const existing = await findDemoStory(supabase, user.id);
    if (existing) {
      return NextResponse.json(
        { storyId: existing.storyId, rootNodeId: existing.rootNodeId },
        { status: 200 },
      );
    }
  }

  try {
    const result = await seedDemoStory({
      userId: user.id,
      locale,
      replace,
      writer: supabaseDemoWriter(supabase),
    });
    return NextResponse.json(result, { status: replace ? 200 : 201 });
  } catch (err) {
    console.error("seedDemoStory route failed", err);
    return NextResponse.json({ error: "seed failed" }, { status: 502 });
  }
}
