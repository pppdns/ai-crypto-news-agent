/**
 * Root layout: fonts, global styles and analytics.
 * The app is dark-only, so `<html>` always carries the `dark` class (see app/globals.css).
 */
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { cn } from '@/lib/utils';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Crypto News Agent',
  description: 'Ask questions about the latest crypto news and get answers cited from recent articles.',
};

export const viewport: Viewport = {
  themeColor: '#16171c',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn('dark', geist.variable, geistMono.variable)}>
      <body className="min-h-dvh antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
