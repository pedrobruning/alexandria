import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { forkStory, SelfForkError } from "@/domains/stories/application/forkStory";
import { getForkSource } from "@/domains/stories/infrastructure/supabaseStoryReader";
import { supabaseForkWriter } from "@/domains/stories/infrastructure/supabaseStoryWriter";

export const runtime = "nodejs";

// Forks a visible story into a private copy the caller owns. The copy is pure
// I/O of frozen passages — no generation, so it never spends quota.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: storyId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const source = await getForkSource(supabase, storyId);
  if (!source) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  try {
    const result = await forkStory({
      userId: user.id,
      source,
      genId: randomUUID,
      writer: supabaseForkWriter(supabase),
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof SelfForkError) {
      return NextResponse.json({ error: "cannot_fork_own" }, { status: 403 });
    }
    console.error("forkStory route failed", err);
    return NextResponse.json({ error: "fork failed" }, { status: 502 });
  }
}
