import Image from "next/image";
import { BRAND } from "@/lib/constants";
import { AnimatedBackground } from "./AnimatedBackground";

export function Hero() {
  return (
    <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-6 pt-24">
      <AnimatedBackground />
      <div className="relative z-10 flex flex-col items-center text-center">
        <div
          className="group mb-8 animate-float"
          style={{ perspective: "1000px" }}
        >
          <div className="relative rounded-3xl border border-cyan-500/30 bg-ni-navy/40 p-4 shadow-[0_0_60px_rgba(0,212,255,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-sm transition duration-500 hover:border-cyan-400/50 hover:shadow-[0_0_80px_rgba(0,212,255,0.35)]">
            <Image
              src="/logo.png"
              alt="Northside Intelligence logo"
              width={120}
              height={120}
              className="h-28 w-28 object-contain drop-shadow-[0_0_20px_rgba(0,212,255,0.4)]"
              priority
            />
          </div>
        </div>
        <h1 className="mb-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
          <span className="inline-block bg-gradient-to-b from-white via-cyan-100 to-cyan-300/80 bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(0,212,255,0.3)]">
            {BRAND.company}
          </span>
        </h1>
        <p className="max-w-xl text-lg sm:text-xl">
          <span className="text-gradient-cyan font-medium tracking-wide">
            {BRAND.tagline}
          </span>
        </p>
        <div className="mt-10 flex gap-3">
          <a
            href="#tools"
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-6 py-3 text-sm font-medium text-cyan-300 shadow-[0_4px_20px_rgba(0,212,255,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] transition hover:border-cyan-400/60 hover:bg-cyan-500/20 hover:shadow-[0_8px_32px_rgba(0,212,255,0.25)]"
          >
            Explore Tools
          </a>
        </div>
      </div>
    </section>
  );
}
