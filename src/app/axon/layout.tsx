import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AXON | Northside Intelligence",
};

export default function AxonLayout({ children }: { children: React.ReactNode }) {
  return children;
}
