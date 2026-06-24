import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { TermsOfServiceContent } from "@/components/legal/TermsOfServiceContent";

export const metadata: Metadata = {
  title: "Terms of Service | Northside Intelligence",
  description:
    "Terms governing use of the Northside Intelligence platform, Intelligence Tools, Smart Store, Intelligence Services, and related products.",
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service">
      <TermsOfServiceContent />
    </LegalLayout>
  );
}
