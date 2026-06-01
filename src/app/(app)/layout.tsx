import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { bootstrapProfile } from "@/domains/identity/application/bootstrapProfile";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await bootstrapProfile(supabase, user.id);

  return <>{children}</>;
}
