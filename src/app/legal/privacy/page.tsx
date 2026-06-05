import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy | Northside Intelligence",
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <p className="text-sm text-ni-muted/80">Last updated: June 4, 2026</p>
      <section>
        <h2 className="mb-3 text-lg font-medium text-white">Overview</h2>
        <p>
          Northside Intelligence respects your privacy. This policy describes how we collect, use,
          and protect information when you use our websites and products.
        </p>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-medium text-white">Information we collect</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Account information (email, name) when you register</li>
          <li>Usage data and logs to improve reliability and security</li>
          <li>Communications you send us (support, feedback, bug reports)</li>
        </ul>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-medium text-white">How we use information</h2>
        <p>
          We use data to operate services, authenticate users, send transactional messages (such as
          verification codes), improve products, and comply with legal obligations.
        </p>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-medium text-white">Third parties</h2>
        <p>
          We use trusted providers (such as Supabase for auth/data and Resend for email delivery).
          These providers process data on our behalf under their own privacy terms.
        </p>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-medium text-white">Contact</h2>
        <p>
          Privacy inquiries:{" "}
          <a href="mailto:privacy@northsideintelligence.com" className="text-cyan-400 hover:text-cyan-300">
            privacy@northsideintelligence.com
          </a>
        </p>
      </section>
    </LegalLayout>
  );
}
