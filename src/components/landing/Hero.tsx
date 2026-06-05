import Link from "next/link";
import { BRAND } from "@/lib/constants";
import { AnimatedBackground } from "./AnimatedBackground";
import { Logo3D } from "./Logo3D";
import { Scene3D } from "./Scene3D";

export function Hero() {
  return (
    <section className="scene-root relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden px-6 pt-24">
      <AnimatedBackground />
      <Scene3D className="relative z-10 flex flex-col items-center text-center">
        <div className="mb-10 animate-float-slow">
          <Logo3D variant="full" />
        </div>
        <h1 className="mb-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
          <span
            className="inline-block bg-gradient-to-b from-white via-cyan-100 to-cyan-300/80 bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(0,212,255,0.3)]"
            style={{ transform: "translateZ(50px)" }}
          >
            {BRAND.company}
          </span>
        </h1>
        <p className="max-w-xl text-lg sm:text-xl" style={{ transform: "translateZ(30px)" }}>
          <span className="text-gradient-cyan font-medium tracking-wide">{BRAND.tagline}</span>
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3" style={{ transform: "translateZ(40px)" }}>
          <a
            href="#tools"
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-6 py-3 text-sm font-medium text-cyan-300 shadow-[0_4px_20px_rgba(0,212,255,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] transition hover:border-cyan-400/60 hover:bg-cyan-500/20 hover:shadow-[0_8px_32px_rgba(0,212,255,0.25)] hover:-translate-y-0.5"
          >
            Explore Tools
          </a>
          <Link
            href="/auth/signup"
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white/90 shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition hover:border-cyan-400/30 hover:bg-white/10 hover:-translate-y-0.5"
          >
            Create Account
          </Link>
        </div>
      </Scene3D>

      {/* Decorative 3D rings */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
        <div className="animate-orbit h-[420px] w-[420px] rounded-full border border-cyan-500/10" />
        <div className="animate-orbit-reverse absolute h-[560px] w-[560px] rounded-full border border-purple-500/10" />
      </div>
    </section>
  );
}
