import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { PrivacyPolicyContent } from "@/components/legal/PrivacyPolicyContent";

export const metadata: Metadata = {
  title: "Privacy Policy | Northside Intelligence",
  description:
    "How Northside Intelligence collects, uses, and protects your personal information across the NI Portal, Intelligence Tools, Smart Store, and related services.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <PrivacyPolicyContent />
    </LegalLayout>
  );
}
