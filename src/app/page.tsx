import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Landing } from "@/components/landing/Landing";

const title = "Alexandria — a story is a tree, not a line";
const description =
  "Branching AI fiction. Write a premise, read a passage, then fork any moment into coexisting timelines. Every choice is a door — open all of them.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    siteName: "Alexandria",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/stories");

  return <Landing />;
}
