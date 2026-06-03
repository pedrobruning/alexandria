import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toggleStar, SelfStarError } from "@/domains/social/application/toggleStar";
import { supabaseStarStore } from "@/domains/social/infrastructure/supabaseStarStore";

export const runtime = "nodejs";

// POST stars, DELETE unstars. Both resolve the story first (RLS makes it visible
// only if public/unlisted or owned) so we can 404 cleanly and reject self-stars.
async function setStar(
  request: Request,
  storyId: string,
  starred: boolean,
): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: story, error } = await supabase
    .from("stories")
    .select("user_id")
    .eq("id", storyId)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: "lookup failed" }, { status: 502 });
  }
  if (!story) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  try {
    await toggleStar({
      userId: user.id,
      ownerId: story.user_id,
      storyId,
      starred,
      store: supabaseStarStore(supabase),
    });
  } catch (err) {
    if (err instanceof SelfStarError) {
      return NextResponse.json({ error: "cannot_star_own" }, { status: 403 });
    }
    return NextResponse.json({ error: "star failed" }, { status: 502 });
  }

  return NextResponse.json({ starred }, { status: 200 });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return setStar(request, id, true);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return setStar(request, id, false);
}
