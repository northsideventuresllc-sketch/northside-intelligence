import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { ToolsCarousel } from "@/components/landing/ToolsCarousel";
import { Mission } from "@/components/landing/Mission";
import { IntelligenceEcosystem } from "@/components/landing/IntelligenceEcosystem";
import { PricingSection } from "@/components/landing/PricingSection";
import { Footer } from "@/components/landing/Footer";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export default async function HomePage() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-ni-bg">
      <Nav />
      <Hero isLoggedIn={!!user} />
      <Mission />
      <ToolsCarousel />
      <IntelligenceEcosystem />
      <PricingSection />
      <Footer />
    </main>
  );
}
