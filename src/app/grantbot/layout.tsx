import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GrantBot | Northside Intelligence",
  description: "AI grant finder and drafter for nonprofits and creators.",
  icons: {
    icon: [{ url: "/logos/grantbot.svg", type: "image/svg+xml" }],
    apple: [{ url: "/logos/grantbot.svg", type: "image/svg+xml" }],
  },
};

export default function GrantBotLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
