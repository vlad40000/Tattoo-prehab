import type { Metadata, Viewport } from 'next';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Machine Hand — Tattoo Artist Longevity',
    template: '%s · Machine Hand',
  },
  description:
    'A workday companion for tattoo artists: prepare, reset, recover, build capacity, and improve workstation ergonomics.',
  applicationName: 'Machine Hand',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Machine Hand' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#02060f',
  width: 'device-width',
  initialScale: 1,
  // No maximumScale / user-scalable lock: pinch-zoom is a WCAG 1.4.4
  // requirement and this app is read at arm's length on a shop iPad.
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
