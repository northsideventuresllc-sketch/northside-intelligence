import Image from "next/image";

export function Nav() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-cyan-500/10 bg-ni-bg/70 shadow-[0_4px_30px_rgba(0,0,0,0.3),inset_0_-1px_0_rgba(0,212,255,0.1)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#" className="group flex items-center gap-3 transition">
          <div className="rounded-xl border border-cyan-500/20 bg-ni-navy/50 p-1.5 shadow-[0_0_20px_rgba(0,212,255,0.1)] transition group-hover:border-cyan-400/40 group-hover:shadow-[0_0_30px_rgba(0,212,255,0.2)]">
            <Image
              src="/logo.png"
              alt="Northside Intelligence"
              width={40}
              height={40}
              className="h-7 w-7 object-contain"
              priority
            />
          </div>
          <span className="hidden text-sm font-medium text-white/90 sm:inline">
            Northside Intelligence
          </span>
        </a>
        <nav className="flex items-center gap-6">
          <a
            href="#tools"
            className="text-sm text-ni-muted transition hover:text-cyan-300"
          >
            Tools
          </a>
          <a
            href="#mission"
            className="text-sm text-ni-muted transition hover:text-cyan-300"
          >
            Mission
          </a>
        </nav>
      </div>
    </header>
  );
}
