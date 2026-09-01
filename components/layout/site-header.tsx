'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@heroui/react';

function HeaderLink({ href, active, children }: { href: '/' | '/news'; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex min-h-11 items-center rounded-md px-3 font-mono text-[11px] tracking-[0.16em] uppercase transition-colors',
        active ? 'bg-accent text-canvas' : 'text-muted hover:bg-raised hover:text-ink',
      )}
    >
      {children}
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [articleCount, setArticleCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('/articles/count')
      .then((res) => res.json())
      .then((data: { count?: number }) => {
        if (typeof data.count === 'number') {
          setArticleCount(data.count);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch article count:', error);
      });
  }, []);

  const formattedCount = articleCount !== null ? articleCount.toLocaleString('en-US') : '—';

  return (
    <header className="border-hairline bg-canvas/88 sticky top-0 z-30 border-b backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[780px] items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2.5">
          <span className="bg-accent inline-block h-1.5 w-1.5 rounded-[1px]" aria-hidden />
          <span className="text-ink font-mono text-[13px] font-medium tracking-[0.2em]">SIGNAL</span>
        </Link>

        <p className="text-faint hidden items-center gap-2 font-mono text-[11px] tracking-[0.14em] sm:flex">
          <span>{formattedCount} ARTICLES</span>
          <span aria-hidden>·</span>
          <span className="text-muted inline-flex items-center gap-1.5">
            <span className="status-dot" aria-hidden />
            INDEX LIVE
          </span>
        </p>

        <nav aria-label="Primary" className="flex items-center gap-1">
          <HeaderLink href="/" active={pathname === '/'}>
            Ask
          </HeaderLink>
          <HeaderLink href="/news" active={pathname === '/news'}>
            Feed
          </HeaderLink>
        </nav>
      </div>
    </header>
  );
}
