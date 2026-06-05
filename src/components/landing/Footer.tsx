import Link from "next/link";
import { BRAND, getCopyrightYear } from "@/lib/constants";

const LEGAL_LINKS = [
  { href: "/legal/terms", label: "Terms of Service" },
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/feedback/report-bug", label: "Report a Bug" },
  { href: "/feedback/share-idea", label: "Share an Idea" },
] as const;

export function Footer() {
  const year = getCopyrightYear();

  return (
    <footer className="relative border-t border-cyan-500/10 px-6 py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6">
        <nav
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
          aria-label="Legal and feedback"
        >
          {LEGAL_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm text-ni-muted transition hover:text-cyan-300"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 text-center text-sm text-ni-muted">
          <p>© {year} {BRAND.company}</p>
          <p>© {year} {BRAND.venturesGroup}</p>
        </div>
      </div>
    </footer>
  );
}
