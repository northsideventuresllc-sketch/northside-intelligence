import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { Nav } from "@/components/landing/Nav";
import { Footer } from "@/components/landing/Footer";
import { SignOutButton } from "@/components/auth/SignOutButton";

export const metadata: Metadata = {
  title: "Account | Northside Intelligence",
};

export default async function AccountPage() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin?from=/account");
  }

  const { data: profile } = await supabase
    .from("ni_portal_profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    profile?.full_name ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Member";

  return (
    <main className="min-h-screen bg-ni-bg">
      <Nav />
      <section className="relative flex min-h-[70vh] items-center justify-center px-6 pt-24">
        <div className="glass-panel w-full max-w-lg p-8 text-center">
          <Image
            src="/logo-full.png"
            alt="Northside Intelligence"
            width={160}
            height={200}
            className="mx-auto mb-6 h-auto w-32 object-contain"
          />
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-ni-cyan/60">Signed in</p>
          <h1 className="mb-2 text-2xl font-semibold text-white">Welcome, {displayName}</h1>
          <p className="mb-8 text-sm text-ni-muted">{profile?.email ?? user.email}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/#tools"
              className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-6 py-3 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
            >
              Explore Tools
            </Link>
            <SignOutButton />
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
