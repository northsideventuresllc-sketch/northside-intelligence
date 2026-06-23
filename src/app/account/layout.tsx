import type { ReactNode } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { NavServer } from "@/components/landing/NavServer";
import { Footer } from "@/components/landing/Footer";
import { AccountSettingsNav } from "@/components/account/AccountSettingsNav";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { getAccountPageData } from "@/lib/account/get-account-page-data";

interface AccountLayoutProps {
  children: ReactNode;
}

export default async function AccountLayout({ children }: AccountLayoutProps) {
  const data = await getAccountPageData();

  if (!data) {
    redirect("/auth/signin?returnTo=/account");
  }

  return (
    <main className="min-h-screen bg-ni-bg">
      <NavServer />
      <section className="relative px-6 pb-20 pt-24">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <Image
              src="/logo-full.png"
              alt="Northside Intelligence"
              width={160}
              height={200}
              className="mx-auto mb-4 h-auto w-28 object-contain"
            />
            <p className="mb-1 text-xs uppercase tracking-[0.2em] text-ni-cyan/60">Signed In</p>
            <h1 className="text-2xl font-semibold text-white">Welcome, {data.displayName}</h1>
            <p className="mt-1 text-sm text-ni-muted">{data.profile?.email ?? data.user.email}</p>
          </div>

          <AccountSettingsNav />
          {children}

          <div className="mt-10 flex justify-center border-t border-white/10 pt-8">
            <SignOutButton label="Log Out" />
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
