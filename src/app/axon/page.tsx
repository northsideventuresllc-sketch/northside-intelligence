import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AxonWaitlistLanding } from "@/components/axon/AxonWaitlistLanding";
import { TrackViewContent } from "@/components/tracking/TrackViewContent";
import { canEnterAxonPortal } from "@/lib/axon/access";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export const metadata: Metadata = {
  title: "AXON — The World's First Neurodivergent AI | Northside Intelligence",
  description:
    "AXON is built to learn who YOU are — and keep all of your data private and secure. AXON by Northside Intelligence. Join the waitlist.",
  alternates: { canonical: "https://www.northsideintelligence.com/axon" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "AXON — The World's First Neurodivergent AI",
    description:
      "AXON is built to learn who YOU are — and keep all of your data private and secure. Join the waitlist.",
    url: "https://www.northsideintelligence.com/axon",
    siteName: "Northside Intelligence",
  },
};

/**
 * AXON is master-account only. Non-master visitors are redirected home —
 * there is no public AXON presence.
 */
export default async function AxonWaitlistPage() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin?returnTo=/axon");
  }

  const allowed = await canEnterAxonPortal(user.id).catch(() => false);
  if (!allowed) {
    redirect("/");
  }

  return (
    <>
      <TrackViewContent contentName="axon" />
      <AxonWaitlistLanding />
    </>
  );
}
