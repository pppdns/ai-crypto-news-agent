'use client';

/**
 * Root error boundary: replaces the root layout when rendering fails, so it brings its own
 * <html>, fonts and global styles. Reports the error to Sentry.
 */
import { Geist } from 'next/font/google';
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Analytics } from '@vercel/analytics/next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" className={cn('dark', geist.variable)}>
      <body className="min-h-dvh antialiased">
        <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-6">
          <h1 className="text-2xl font-semibold tracking-tight">This page failed to load</h1>
          <p className="text-muted-foreground text-[15px] leading-relaxed">
            The error has been reported. Try loading the page again; if it keeps happening, check the server logs.
          </p>
          {error.message && (
            <pre className="bg-card text-destructive overflow-auto rounded-lg border p-3 text-sm whitespace-pre-wrap">
              {error.message}
            </pre>
          )}
          <div>
            <Button onClick={reset}>Try again</Button>
          </div>
        </main>
        <Analytics />
      </body>
    </html>
  );
}
