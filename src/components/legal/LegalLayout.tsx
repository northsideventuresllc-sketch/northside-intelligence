import Link from "next/link";
import type { ReactNode } from "react";
import { Nav } from "@/components/landing/Nav";
import { Footer } from "@/components/landing/Footer";

interface LegalLayoutProps {
  title: string;
  children: ReactNode;
}

export function LegalLayout({ title, children }: LegalLayoutProps) {
  return (
    <main className="min-h-screen bg-ni-bg">
      <Nav />
      <article className="mx-auto max-w-3xl px-6 pb-16 pt-28">
        <Link href="/" className="mb-8 inline-block text-sm text-ni-muted transition hover:text-cyan-300">
          ← Back to home
        </Link>
        <h1 className="mb-8 text-3xl font-semibold text-white">{title}</h1>
        <div className="prose-legal space-y-6 text-ni-muted">{children}</div>
      </article>
      <Footer />
    </main>
  );
}
