// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Nav } from '@/components/Nav'

export const metadata: Metadata = {
  title: 'Nexus — SAT Practice',
  description: 'Adaptive SAT prep with real questions, timed tests, and smart analytics.',
  metadataBase: new URL('https://nexus-sat.vercel.app'),
  openGraph: {
    title: 'Nexus — SAT Practice',
    description: 'Adaptive SAT prep with real questions, timed tests, and smart analytics.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#090d13',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Nav />
        <main style={{ paddingTop: 'var(--nav-h)' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
