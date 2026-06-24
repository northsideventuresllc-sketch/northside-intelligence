import { NavServer } from "@/components/landing/NavServer";
import { PromosPageClient } from "@/components/promos/PromosPageClient";

export const metadata = {
  title: "Promos | Northside Intelligence",
  description: "Your personalized promos and deals from Northside Intelligence.",
};

export default function PromosPage() {
  return (
    <div className="min-h-screen bg-ni-bg">
      <NavServer />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6">
        <PromosPageClient />
      </main>
    </div>
  );
}
