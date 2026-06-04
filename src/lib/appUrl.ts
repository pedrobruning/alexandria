// The app's public base URL. Route handlers otherwise derive the origin from
// the incoming request, but behind the proxy that fronts the deployment that
// origin is the internal address (localhost:3000) — so referral links and
// post-login redirects built from it send visitors to localhost. Prefer the
// configured public URL; fall back to the request origin only when it isn't
// set (local dev).
export function appBaseUrl(fallbackOrigin?: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return (configured || fallbackOrigin || "").replace(/\/+$/, "");
}
