'use client';

/**
 * Sticky top bar shared by all pages: wordmark, primary navigation and an optional
 * page-specific action slot (e.g. the chat's "New chat" button).
 *
 * Usage:
 *   <SiteHeader articleCount={1234} actions={<Button>New chat</Button>} />
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SiteHeaderProps {
  articleCount?: number | null;
  actions?: React.ReactNode;
  className?: string;
}

const NAV_ITEMS = [
  { href: '/', label: 'Ask' },
  { href: '/news', label: 'News' },
] as const;

export function SiteHeader({ articleCount, actions, className }: SiteHeaderProps) {
  const pathname = usePathname();

  return (
    <header
      className={cn(
        'bg-background/80 supports-backdrop-filter:bg-background/65 sticky top-0 z-20 border-b backdrop-blur-md',
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Link
          href="/"
          className="focus-visible:ring-ring/50 flex shrink-0 items-center gap-2.5 rounded-md text-sm font-semibold tracking-tight whitespace-nowrap outline-none focus-visible:ring-3"
        >
          <span aria-hidden className="bg-primary relative flex size-5 items-center justify-center rounded-[5px]">
            <span className="bg-primary-foreground size-1.5 rounded-full" />
          </span>
          <span className="max-sm:sr-only">Crypto News Agent</span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1 text-sm">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors outline-none focus-visible:ring-3',
                  isActive && 'bg-muted text-foreground',
                )}
              >
                {item.label}
                {item.href === '/news' && articleCount != null && (
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {articleCount.toLocaleString('en-US')}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
