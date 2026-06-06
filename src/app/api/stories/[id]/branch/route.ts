import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePassage } from "@/domains/generation/application/generatePassage";
import { createBranch } from "@/domains/stories/application/createBranch";
import { supabaseBranchWriter } from "@/domains/stories/infrastructure/supabaseStoryWriter";
import { getBranchContext } from "@/domains/stories/infrastructure/supabaseStoryReader";
import { countQuotaNodes } from "@/domains/quota/infrastructure/supabaseQuotaCounter";
import { readBonusCredits, consumeCredit } from "@/domains/quota/infrastructure/credits";
import { claimDemoFork, releaseDemoFork } from "@/domains/onboarding/infrastructure/demoFork";
import { decideGeneration, SERVER_KEY_BRANCH_LIMIT } from "@/domains/quota/domain/quota";
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

  // SELECT RLS now exposes others' public/unlisted stories, so reject non-owners
  // before counting quota or generating — a viewer must fork to branch, and must
  // never spend a generation on a story they don't own.
  const context = await getBranchContext(supabase, storyId);
  if (!context) {
    return NextResponse.json({ error: "story not found" }, { status: 404 });
  }
  if (context.ownerId !== user.id) {
    return NextResponse.json({ error: "not_owner" }, { status: 403 });
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

  // The onboarding demo grants exactly one free, quota-exempt generation so the
  // newcomer feels a branch being born from their own steer. Claiming the
  // allowance is atomic; once spent, the demo is read-only. Demo nodes live on
  // the demo story, which the quota counter already excludes, so no allowance is
  // spent and no credit is consumed below. Claim only after the parent is known
  // valid, so a bad request never burns the freebie.
  let spendCredit = false;
  if (context.isDemo) {
    const claimed = await claimDemoFork(supabase, user.id);
    if (!claimed) {
      return NextResponse.json({ error: "demo_spent" }, { status: 403 });
    }
  } else {
    const used = await countQuotaNodes(supabase, user.id);
    const bonusCredits = await readBonusCredits(supabase, user.id);
    const decision = decideGeneration({ used, bonusCredits });
    if (!decision.allowed) {
      return NextResponse.json(
        { error: "quota_exceeded", limit: SERVER_KEY_BRANCH_LIMIT },
        { status: 429 },
      );
    }
    spendCredit = decision.spendCredit;
  }

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
    if (spendCredit) await consumeCredit(supabase);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    // The demo claim happened before generation; hand the freebie back so a
    // failed call doesn't burn the newcomer's one free branch.
    if (context.isDemo) await releaseDemoFork(supabase, user.id);
    console.error("createBranch route failed", err);
    return NextResponse.json({ error: "generation failed" }, { status: 502 });
  }
}
