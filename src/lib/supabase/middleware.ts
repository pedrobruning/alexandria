import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/db.types";

// Refreshes the Supabase auth session on each request and propagates updated
// cookies onto the response. Called from the root middleware.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Touch the session so expired tokens get refreshed into the response cookies.
  // A failed refresh (stale/invalid cookie or a transient Supabase network blip)
  // must not take the whole request down — degrade to unauthenticated instead of
  // letting the exception bubble out of middleware and 502 the page.
  try {
    await supabase.auth.getUser();
  } catch {
    // Intentionally swallowed: proceed as logged-out; the client can re-auth.
  }

  return supabaseResponse;
}
