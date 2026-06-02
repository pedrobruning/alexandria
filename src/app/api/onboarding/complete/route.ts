import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { markOnboarded } from "@/domains/identity/application/markOnboarded";
import { supabaseOnboardingWriter } from "@/domains/identity/infrastructure/supabaseOnboarding";

export const runtime = "nodejs";

// Records that the user finished or skipped the tour. Idempotent: markOnboarded
// keeps the first timestamp, so replaying the tour never moves it.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await markOnboarded(supabaseOnboardingWriter(supabase), user.id);
  return NextResponse.json({ ok: true });
}
