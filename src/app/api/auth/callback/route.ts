import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/safeRedirect";
import { bootstrapProfile } from "@/domains/identity/application/bootstrapProfile";
import { REFERRAL_COOKIE } from "@/domains/referrals/domain/referrals";
import { appBaseUrl } from "@/lib/appUrl";

// Magic-link landing: exchanges the PKCE code for a session cookie, then
// redirects into the app. If the visitor arrived through an invite link, a
// referral_code cookie is waiting — attribute them to the inviter exactly once
// now that a session exists, then clear the cookie.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const base = appBaseUrl(origin);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await bootstrapProfile(supabase, user.id);
        const cookieStore = await cookies();
        const referralCode = cookieStore.get(REFERRAL_COOKIE)?.value;
        if (referralCode) {
          await supabase.rpc("claim_referral", { p_code: referralCode });
          cookieStore.delete(REFERRAL_COOKIE);
        }
      }
      return NextResponse.redirect(`${base}${next}`);
    }
  }

  return NextResponse.redirect(`${base}/login?error=auth`);
}
