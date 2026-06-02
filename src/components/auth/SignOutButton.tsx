"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const t = useTranslations("common");
  const router = useRouter();

  async function onClick() {
    await createClient().auth.signOut();
    router.replace("/login");
  }

  return (
    <button className="btn btn--ghost" onClick={onClick}>
      {t("signOut")}
    </button>
  );
}
