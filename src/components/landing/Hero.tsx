import Image from "next/image";
import { BRAND } from "@/lib/constants";
import { AnimatedBackground } from "./AnimatedBackground";

export function Hero() {
  return (
    <section className="relative flex min-h-[85vh] flex-col items-center justify-center px-6 pt-24">
      <AnimatedBackground />
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="mb-8 animate-float">
          <Image
            src="/logo.png"
            alt="Northside Intelligence logo"
            width={120}
            height={120}
            className="h-28 w-28 object-contain shadow-glow"
            priority
          />
        </div>
        <h1 className="mb-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
          Northside Intelligence
        </h1>
        <p className="max-w-xl text-lg text-ni-muted sm:text-xl">
          <span className="text-gradient-cyan font-medium">{BRAND.tagline}</span>
        </p>
      </div>
    </section>
  );
}
