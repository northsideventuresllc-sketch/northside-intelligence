import { Footer } from "@/components/landing/Footer";
import { NavServer } from "@/components/landing/NavServer";
import { ShareIdeaPageClient } from "@/app/feedback/share-idea/ShareIdeaPageClient";

export default function ShareIdeaPage() {
  return (
    <main className="min-h-screen bg-ni-bg">
      <NavServer />
      <ShareIdeaPageClient />
      <Footer />
    </main>
  );
}
