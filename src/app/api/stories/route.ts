import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePassage } from "@/domains/generation/application/generatePassage";
import { createStory } from "@/domains/stories/application/createStory";
import { supabaseStoryWriter } from "@/domains/stories/infrastructure/supabaseStoryWriter";
import { DEFAULT_LANGUAGE, isLanguageCode } from "@/domains/generation/domain/language";
import { resolveGenerationAuth } from "@/domains/generation/domain/credentials";

export const runtime = "nodejs";

type Body = {
  premise?: unknown;
  genre?: unknown;
  tone?: unknown;
  language?: unknown;
  apiKey?: unknown;
  model?: unknown;
};

function asTrimmed(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const premise = asTrimmed(body.premise);
  if (!premise) {
    return NextResponse.json({ error: "premise is required" }, { status: 400 });
  }
  const genre = asTrimmed(body.genre);
  const tone = asTrimmed(body.tone);
  const language = isLanguageCode(body.language) ? body.language : DEFAULT_LANGUAGE;

  const serverKey = process.env.OPENROUTER_API_KEY;
  const defaultModel = process.env.OPENROUTER_DEFAULT_MODEL;
  if (!serverKey || !defaultModel) {
    return NextResponse.json({ error: "generation is not configured" }, { status: 503 });
  }

  const { apiKey, model, usedServerKey } = resolveGenerationAuth({
    byokKey: asTrimmed(body.apiKey),
    byokModel: asTrimmed(body.model),
    serverKey,
    defaultModel,
  });

  const story = { premise, genre, tone, language };

  try {
    const result = await createStory({
      story,
      userId: user.id,
      model,
      usedServerKey,
      generate: () => generatePassage({ story, apiKey, model }),
      writer: supabaseStoryWriter(supabase),
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "generation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
