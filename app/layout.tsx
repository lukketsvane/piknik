import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'PikNik | Kreativ matlagingsapp',
    template: '%s | PikNik'
  },
  description: 'PikNik er en interaktiv matlagingsapp der brukere kan samarbeide i sanntid for å lage kreative oppskrifter basert på ingrediensene de har.',
  keywords: ['matlaging', 'oppskrifter', 'samarbeid', 'kreativ matlaging', 'matlagingsapp'],
  authors: [{ name: 'PikNik Team' }],
  creator: 'PikNik Team',
  publisher: 'PikNik',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'nb_NO',
    url: 'https://piknik.no',
    title: 'PikNik | Kreativ matlagingsapp',
    description: 'Samarbeid om kreative oppskrifter i sanntid med PikNik',
    siteName: 'PikNik',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PikNik | Kreativ matlagingsapp',
    description: 'Samarbeid om kreative oppskrifter i sanntid med PikNik',
    creator: '@PikNikApp',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  verification: {
    google: 'your-google-site-verification-code',
    yandex: 'your-yandex-verification-code',
    bing: 'your-bing-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="no" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <link rel="icon" type="image/png" href="/favicon-48x48.png" sizes="48x48" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}