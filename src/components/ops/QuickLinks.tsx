import type { ReactNode } from "react";
import { QUICK_LINKS } from "@/lib/constants";

function LinkIcon({ icon }: { icon: string }) {
  const icons: Record<string, ReactNode> = {
    github: (
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.36-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
    ),
    database: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <ellipse cx="12" cy="5" rx="9" ry="3" strokeWidth="2" />
        <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" strokeWidth="2" />
        <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" strokeWidth="2" />
      </svg>
    ),
    vercel: (
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M12 2L2 19.5h20L12 2z" />
      </svg>
    ),
    stripe: (
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.609 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
      </svg>
    ),
  };
  return <>{icons[icon] ?? icons.database}</>;
}

export function QuickLinks() {
  return (
    <section id="links" className="scroll-mt-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Quick Links</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {QUICK_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-ni-navy/30 p-6 text-center transition hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-cyan-300"
          >
            <span className="text-ni-muted transition group-hover:text-cyan-300">
              <LinkIcon icon={link.icon} />
            </span>
            <span className="text-sm font-medium text-white">{link.label}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
