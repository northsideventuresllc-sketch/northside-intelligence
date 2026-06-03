import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "Northside Intelligence",
  description:
    "We find the gaps and make it better. Tech and AI tools built for humans.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://northsideintelligence.com"
  ),
};
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Northside Intelligence',
  description: 'Sector 3 — AI tools for operators, builders, and teams.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}
