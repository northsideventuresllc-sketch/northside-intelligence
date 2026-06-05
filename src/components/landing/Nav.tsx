import Link from "next/link";
import { Logo3D } from "./Logo3D";

export function Nav() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-cyan-500/10 bg-ni-bg/70 shadow-[0_4px_30px_rgba(0,0,0,0.3),inset_0_-1px_0_rgba(0,212,255,0.1)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-3 transition">
          <Logo3D variant="emblem" className="!h-10 !w-10 sm:!h-11 sm:!w-11" />
          <span className="hidden text-sm font-medium text-white/90 sm:inline">
            Northside Intelligence
          </span>
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6">
          <a
            href="/#tools"
            className="text-sm text-ni-muted transition hover:text-cyan-300"
          >
            Tools
          </a>
          <a
            href="/#mission"
            className="hidden text-sm text-ni-muted transition hover:text-cyan-300 sm:inline"
          >
            Mission
          </a>
          <Link
            href="/auth/signin"
            className="text-sm text-ni-muted transition hover:text-cyan-300"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-sm font-medium text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/20"
          >
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}
