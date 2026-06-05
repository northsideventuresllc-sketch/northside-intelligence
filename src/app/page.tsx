import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { ToolsCarousel } from "@/components/landing/ToolsCarousel";
import { Mission } from "@/components/landing/Mission";
import { IntelligenceEcosystem } from "@/components/landing/IntelligenceEcosystem";
import { Footer } from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-ni-bg">
      <Nav />
      <Hero />
      <ToolsCarousel />
      <Mission />
      <IntelligenceEcosystem />
      <Footer />
    </main>
  );
}
