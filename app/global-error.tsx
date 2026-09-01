'use client';

// import NextError from 'next/error';
import Error from 'next/error';
import { Geist, Geist_Mono } from 'next/font/google';
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Analytics } from '@vercel/analytics/next';
import { Frown } from 'lucide-react';
import './globals.css';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

export default function GlobalError({ error }: { error: Error & { digest?: string; message?: string } }) {
  useEffect(() => {
    console.error(error);
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-canvas text-ink antialiased`}>
        <div className="flex h-full min-h-dvh w-full flex-col items-center justify-center p-8">
          <Frown className="text-danger mb-4 h-12 w-12" />

          <h1 className="text-ink mb-4 text-2xl font-medium tracking-tight">An error occurred</h1>

          {error.message && (
            <div className="border-hairline bg-surface text-danger mb-4 max-w-lg overflow-auto rounded-md border p-3 font-mono text-sm">
              {error.message}
            </div>
          )}

          <p className="text-muted mb-4 max-w-md text-center">
            We apologize for the inconvenience. We logged the error details and will investigate the issue.
          </p>
        </div>
        {/* <NextError statusCode={0} title={'😞'} /> */}
        <Analytics />
      </body>
    </html>
  );
}
