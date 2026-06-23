import { NavServer } from "@/components/landing/NavServer";
import { Hero } from "@/components/landing/Hero";
import { ToolsCarousel } from "@/components/landing/ToolsCarousel";
import { Mission } from "@/components/landing/Mission";
import { IntelligenceEcosystem } from "@/components/landing/IntelligenceEcosystem";
import { PricingSection } from "@/components/landing/PricingSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { Footer } from "@/components/landing/Footer";
import { getCarouselTools } from "@/lib/arm3-live-tools";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export default async function HomePage() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const tools = await getCarouselTools();

  return (
    <main className="min-h-screen bg-ni-bg">
      <NavServer />
      <Hero isLoggedIn={!!user} />
      <Mission />
      <ToolsCarousel tools={tools} />
      <IntelligenceEcosystem />
      <PricingSection />
      <FaqSection />
      <Footer />
    </main>
  );
}
