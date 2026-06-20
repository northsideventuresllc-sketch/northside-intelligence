import { redirect } from "next/navigation";
import Link from "next/link";
import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { PORTAL_SIGNIN_URL } from "@/lib/sector3-registry";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export default async function GrantBotDashboardPage() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(PORTAL_SIGNIN_URL);

  return (
    <main className="min-h-screen bg-ni-bg">
      <Nav />
      <section className="px-6 pb-20 pt-24">
        <div className="glass-panel mx-auto max-w-lg p-8 text-center">
          <h1 className="text-2xl font-semibold text-white">GrantBot</h1>
          <p className="mt-3 text-ni-muted">
            GrantBot is still in development. We&apos;ll email you the moment it&apos;s ready —
            check back soon for the full grant-finding and drafting experience.
          </p>
          <Link
            href="/tools/grantbot"
            className="mt-6 inline-block rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-2.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20"
          >
            Back to GrantBot
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
