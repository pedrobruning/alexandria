import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db.types";
import { generateReferralCode } from "@/domains/referrals/domain/referrals";

// Ensures a profiles row exists for the signed-in user, with a referral code.
// Idempotent: safe to call on every authenticated request. RLS restricts the
// upsert to self. The code is backfilled here because rows predating the
// referral feature have none; the `is null` guard keeps it set-once and
// race-safe.
export async function bootstrapProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  await supabase
    .from("profiles")
    .upsert({ id: userId }, { onConflict: "id", ignoreDuplicates: true });

  const { data } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("id", userId)
    .single();

  if (data && data.referral_code === null) {
    await supabase
      .from("profiles")
      .update({ referral_code: generateReferralCode() })
      .eq("id", userId)
      .is("referral_code", null);
  }
}
