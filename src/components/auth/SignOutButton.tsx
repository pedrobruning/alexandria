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
    <button className="btn btn--ghost" onClick={onClick}>
      Sign out
    </button>
  );
}
