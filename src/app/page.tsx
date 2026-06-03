import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { ToolsGrid } from "@/components/landing/ToolsGrid";
import { Mission } from "@/components/landing/Mission";
import { Footer } from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-ni-bg">
      <Nav />
      <Hero />
      <ToolsGrid />
      <Mission />
      <Footer />
    </main>
  );
}
