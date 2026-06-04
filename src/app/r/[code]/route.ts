import { NextResponse } from "next/server";
import { REFERRAL_COOKIE, isReferralCode } from "@/domains/referrals/domain/referrals";
import { appBaseUrl } from "@/lib/appUrl";

export const runtime = "nodejs";

// Public invite landing. Stashes a valid referral code in a short-lived httpOnly
// cookie so it survives the magic-link round trip, then sends the visitor to
// login. Attribution itself happens in the auth callback once a session exists.
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { origin } = new URL(request.url);
  const response = NextResponse.redirect(`${appBaseUrl(origin)}/login`);

  const normalized = code.trim().toUpperCase();
  if (isReferralCode(normalized)) {
    response.cookies.set(REFERRAL_COOKIE, normalized, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
}
