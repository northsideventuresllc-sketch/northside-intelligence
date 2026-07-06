import type { Metadata } from "next";
import { AxonWaitlistLanding } from "@/components/axon/AxonWaitlistLanding";

export const metadata: Metadata = {
  title: "AXON — The World's First Neurodivergent AI | NORTHSiDE Intelligence",
  description:
    "AXON is built to learn who YOU are — and keep all of your data private and secure. AXON by NORTHSiDE Intelligence. Join the waitlist.",
  alternates: { canonical: "https://www.northsideintelligence.com/axon" },
  openGraph: {
    title: "AXON — The World's First Neurodivergent AI",
    description:
      "AXON is built to learn who YOU are — and keep all of your data private and secure. Join the waitlist.",
    url: "https://www.northsideintelligence.com/axon",
    siteName: "NORTHSiDE Intelligence",
  },
};

export default function AxonWaitlistPage() {
  return <AxonWaitlistLanding />;
}
