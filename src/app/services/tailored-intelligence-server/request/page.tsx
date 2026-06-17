import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { TailoredServerRequestForm } from "@/components/services/TailoredServerRequestForm";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import type { AccountType } from "@/lib/services/offerings";

export const metadata: Metadata = {
  title: "Tailored Intelligence Server Request | Northside Intelligence",
  description:
    "Submit your request for a custom intelligence server built around your workflows and systems.",
};

export default async function TailoredServerRequestPage() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin?returnTo=/services/tailored-intelligence-server/request");
  }

  const { data: profile } = await supabase
    .from("ni_portal_profiles")
    .select("full_name, email, account_type, business_name")
    .eq("id", user.id)
    .maybeSingle();

  const contactName =
    profile?.full_name ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "";
  const email = profile?.email ?? user.email ?? "";
  const accountType = (profile?.account_type ?? "personal") as AccountType;
  const businessName = profile?.business_name ?? "";

  return (
    <main className="min-h-screen bg-ni-bg">
      <Nav />
      <div className="mx-auto max-w-2xl px-6 pb-16 pt-28">
        <Link
          href="/services"
          className="mb-8 inline-block text-sm text-ni-muted transition hover:text-cyan-300"
        >
          ← Back to Intelligence Services
        </Link>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-ni-cyan/60">
          Service Request
        </p>
        <h1 className="mb-2 text-3xl font-semibold text-white">
          Tailored Intelligence Server Request
        </h1>
        <p className="mb-8 text-ni-muted">
          Tell us about your workflows, systems, and goals. The more detail you provide, the
          better we can tailor our approach to your needs.
        </p>
        <TailoredServerRequestForm
          initialData={{
            contactName,
            email,
            accountType,
            businessName,
          }}
        />
      </div>
      <Footer />
    </main>
  );
}
