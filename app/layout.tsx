import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SiteHeader } from '@/components/layout/site-header';
import './globals.css';
import { HeroUIProvider } from './hero-ui-provider';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: 'AI Crypto News Agent',
  description: 'Grounded answers from the latest cryptocurrency news.',
};

export const viewport: Viewport = {
  themeColor: '#07080A',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <HeroUIProvider>
          <div className="bg-canvas text-ink flex min-h-dvh flex-col">
            <SiteHeader />
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </div>
        </HeroUIProvider>
        <Analytics />
      </body>
    </html>
  );
}
