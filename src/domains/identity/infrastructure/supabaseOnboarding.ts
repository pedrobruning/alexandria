import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db.types";
import type { OnboardingWriter } from "../application/markOnboarded";

// Supabase-backed OnboardingWriter. RLS restricts both queries to the caller's
// own profile row.
export function supabaseOnboardingWriter(
  supabase: SupabaseClient<Database>,
): OnboardingWriter {
  return {
    async getOnboardedAt(userId) {
      const { data, error } = await supabase
        .from("profiles")
        .select("onboarded_at")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw new Error(`getOnboardedAt: ${error.message}`);
      return data?.onboarded_at ?? null;
    },

    async setOnboardedAt(userId) {
      const { error } = await supabase
        .from("profiles")
        .update({ onboarded_at: new Date().toISOString() })
        .eq("id", userId);
      if (error) throw new Error(`setOnboardedAt: ${error.message}`);
    },
  };
}
