import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Terms of Service | Northside Intelligence",
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service">
      <p className="text-sm text-ni-muted/80">Last updated: June 4, 2026</p>
      <section>
        <h2 className="mb-3 text-lg font-medium text-white">1. Acceptance</h2>
        <p>
          By accessing or using Northside Intelligence products, websites, and services, you agree
          to these Terms of Service. If you do not agree, do not use our services.
        </p>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-medium text-white">2. Services</h2>
        <p>
          Northside Intelligence provides technology, AI tools, marketplaces, and related platforms
          across multiple sectors. Features may change, and some tools may be offered in beta or
          preview.
        </p>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-medium text-white">3. Accounts</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and for
          all activity under your account. Notify us promptly of unauthorized use.
        </p>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-medium text-white">4. Acceptable use</h2>
        <p>
          You may not misuse our services, attempt unauthorized access, interfere with platform
          operation, or use our tools for unlawful purposes.
        </p>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-medium text-white">5. Contact</h2>
        <p>
          Questions about these terms:{" "}
          <a href="mailto:legal@northsideintelligence.com" className="text-cyan-400 hover:text-cyan-300">
            legal@northsideintelligence.com
          </a>
        </p>
      </section>
    </LegalLayout>
  );
}
