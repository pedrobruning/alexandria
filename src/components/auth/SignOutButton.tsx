"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function onClick() {
    await createClient().auth.signOut();
    router.replace("/login");
  }

  return (
    <button
      onClick={onClick}
      className="text-sm text-neutral-500 underline-offset-4 hover:underline"
    >
      Sign out
    </button>
  );
}
