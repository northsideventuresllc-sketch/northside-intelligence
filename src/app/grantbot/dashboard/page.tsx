import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AddToToolCasePrompt } from "@/components/billing/AddToToolCasePrompt";
import { userCanUseTool, getUserBillingState } from "@/lib/billing/entitlements";
import { portalSignInUrl } from "@/lib/grantbot/auth";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export default async function GrantBotDashboardPage() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(portalSignInUrl());

  const billing = await getUserBillingState(user.id);
  const canUse = userCanUseTool(billing, "grantbot");

  if (!canUse) {
    return (
      <div className="relative min-h-screen px-6 py-16">
        <div className="mx-auto max-w-lg text-center">
          <Image
            src="/logos/grantbot.svg"
            alt="GrantBot"
            width={72}
            height={72}
            className="mx-auto mb-6"
          />
          <h1 className="text-2xl font-semibold text-white">GrantBot Dashboard</h1>
          <div className="mt-8">
            <AddToToolCasePrompt toolSlug="grantbot" toolName="GrantBot" variant="portal" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-4">
          <Image src="/logos/grantbot.svg" alt="GrantBot" width={48} height={48} />
          <div>
            <h1 className="text-2xl font-semibold text-white">GrantBot Dashboard</h1>
            <p className="text-sm text-ni-muted">Signed in as {user.email}</p>
          </div>
        </div>

        <div className="glass-panel p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-300">
            You Have Access
          </p>
          <p className="mx-auto mt-3 max-w-md text-ni-muted">
            Grant discovery and drafting tools are rolling out here. Check back soon for grant
            search, eligibility matching, and AI-assisted application drafts.
          </p>
          <Link
            href="/toolkit"
            className="mt-6 inline-block rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-2.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20"
          >
            View Toolkit
          </Link>
        </div>
      </div>
    </div>
  );
}
