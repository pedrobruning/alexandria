import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePassage } from "@/domains/generation/application/generatePassage";
import { createBranch } from "@/domains/stories/application/createBranch";
import { supabaseBranchWriter } from "@/domains/stories/infrastructure/supabaseStoryWriter";
import { getBranchContext } from "@/domains/stories/infrastructure/supabaseStoryReader";
import { countQuotaNodes } from "@/domains/quota/infrastructure/supabaseQuotaCounter";
import { checkQuota } from "@/domains/quota/domain/quota";
import { pathFromRoot, type TreeNode } from "@/lib/tree/path";

export const runtime = "nodejs";

type Body = { parentId?: unknown; steer?: unknown };

function asTrimmed(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: storyId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const parentId = asTrimmed(body.parentId);
  if (!parentId) {
    return NextResponse.json({ error: "parentId is required" }, { status: 400 });
  }
  const steer = asTrimmed(body.steer);

  const serverKey = process.env.OPENROUTER_API_KEY;
  const defaultModel = process.env.OPENROUTER_DEFAULT_MODEL;
  if (!serverKey || !defaultModel) {
    return NextResponse.json({ error: "generation is not configured" }, { status: 503 });
  }

  const used = await countQuotaNodes(supabase, user.id);
  const decision = checkQuota({ used });
  if (!decision.allowed) {
    return NextResponse.json({ error: "quota_exceeded", limit: decision.limit }, { status: 429 });
  }

  const context = await getBranchContext(supabase, storyId);
  if (!context) {
    return NextResponse.json({ error: "story not found" }, { status: 404 });
  }
  if (context.isDemo) {
    return NextResponse.json({ error: "demo_readonly" }, { status: 403 });
  }

  const byId = new Map(context.nodes.map((n) => [n.id, n]));
  if (!byId.has(parentId)) {
    return NextResponse.json({ error: "parent not found" }, { status: 404 });
  }
  const tree: TreeNode[] = context.nodes.map((n) => ({ id: n.id, parentId: n.parentId }));
  const parentPath = pathFromRoot(tree, parentId).map((n) => {
    const node = byId.get(n.id)!;
    return { summary: node.summary, content: node.content };
  });

  try {
    const result = await createBranch({
      storyId,
      parentId,
      parentPath,
      userId: user.id,
      model: defaultModel,
      steer,
      generate: (ancestors, s) =>
        generatePassage({
          story: context.story,
          apiKey: serverKey,
          model: defaultModel,
          ancestors,
          steer: s,
        }),
      writer: supabaseBranchWriter(supabase),
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("createBranch route failed", err);
    return NextResponse.json({ error: "generation failed" }, { status: 502 });
  }
}
