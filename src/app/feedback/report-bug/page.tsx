import { Footer } from "@/components/landing/Footer";
import { NavServer } from "@/components/landing/NavServer";
import { ReportBugPageClient } from "@/app/feedback/report-bug/ReportBugPageClient";

export default function ReportBugPage() {
  return (
    <main className="min-h-screen bg-ni-bg">
      <NavServer />
      <ReportBugPageClient />
      <Footer />
    </main>
  );
}
