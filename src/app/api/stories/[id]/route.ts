import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Visibility } from "@/domains/stories/domain/types";

export const runtime = "nodejs";

type Body = { visibility?: unknown };

const VISIBILITIES: Visibility[] = ["private", "unlisted", "public"];

function asVisibility(value: unknown): Visibility | null {
  return VISIBILITIES.includes(value as Visibility) ? (value as Visibility) : null;
}

// Sets a story's sharing state. Owner-only: the stories UPDATE policy scopes the
// write to the owner, so a non-owner's update simply matches no row.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: storyId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const visibility = asVisibility(body.visibility);
  if (!visibility) {
    return NextResponse.json({ error: "invalid visibility" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("stories")
    .update({ visibility })
    .eq("id", storyId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: "update failed" }, { status: 502 });
  }
  if (!data) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ visibility }, { status: 200 });
}
