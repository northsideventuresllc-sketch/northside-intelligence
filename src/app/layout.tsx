import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Northside Intelligence',
  description: 'Sector 3 — AI tools for operators, builders, and teams.',
}

export default function RootLayout({
  children,
}: Readonly<{
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
