import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/db.types";

// Browser-side Supabase client (publishable key). Safe to use in client components.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
