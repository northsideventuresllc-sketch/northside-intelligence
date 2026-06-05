import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { SectorBanner } from "@/components/landing/SectorBanner";
import { ToolsCarousel } from "@/components/landing/ToolsCarousel";
import { Mission } from "@/components/landing/Mission";
import { Sector1AHub } from "@/components/landing/Sector1AHub";
import { Footer } from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-ni-bg">
      <Nav />
      <Hero />
      <SectorBanner />
      <ToolsCarousel />
      <Mission />
      <Sector1AHub />
      <Footer />
    </main>
  );
}
