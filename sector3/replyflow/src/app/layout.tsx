import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ReplyFlow — AI Customer Service Replies',
  description: 'Generate professional customer service responses in seconds with AI.',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
