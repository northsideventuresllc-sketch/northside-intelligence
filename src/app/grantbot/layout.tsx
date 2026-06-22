import type { Metadata } from "next";
import { Sector3BackToHome } from "@/components/sector3/Sector3BackToHome";

export const metadata: Metadata = {
  title: "GrantBot — AI Grant Finder & Drafter",
  description: "Find and draft grant applications with AI for nonprofits and creators.",
  icons: {
    icon: [{ url: "/logos/grantbot.svg", type: "image/svg+xml" }],
    apple: [{ url: "/logos/grantbot.svg", type: "image/svg+xml" }],
  },
};

export default function GrantBotLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grantbot-root flex min-h-screen flex-col bg-ni-bg text-white antialiased">
      <div className="flex-1">{children}</div>
      <Sector3BackToHome variant="grantbot" />
    </div>
  );
}
