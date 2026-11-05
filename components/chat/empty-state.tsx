/**
 * The chat's starting screen: a headline, the composer, suggested questions and the
 * most recent headlines in the index (so it's clear how fresh the data is).
 */
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/client/relative-time';
import type { IndexStats } from '@/lib/client/types';

export const SUGGESTED_QUESTIONS = [
  'What happened with Solana ETFs this week?',
  'How did Bitcoin perform this week?',
  'Latest XRP news?',
  'Any major exchange hacks recently?',
] as const;

interface EmptyStateProps {
  stats: IndexStats | null;
  composer: React.ReactNode;
  onSuggestion: (question: string) => void;
  disabled: boolean;
}

export function EmptyState({ stats, composer, onSuggestion, disabled }: EmptyStateProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-4 pt-[12vh] pb-16 sm:px-6">
      <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-balance sm:text-[2.5rem]">
        Ask about this week in crypto
      </h1>
      <p className="text-muted-foreground mt-3 max-w-xl text-[15px] leading-relaxed text-pretty">
        {stats && stats.articleCount > 0
          ? `Answers come only from ${stats.articleCount.toLocaleString('en-US')} articles by ${stats.sourceCount} crypto publishers, and every claim links back to its source.`
          : 'Answers come only from recent articles by crypto publishers, and every claim links back to its source.'}
      </p>

      <div className="mt-8">{composer}</div>

      <ul aria-label="Suggested questions" className="mt-4 flex flex-wrap gap-2">
        {SUGGESTED_QUESTIONS.map((question) => (
          <li key={question}>
            <Button
              variant="outline"
              className="text-muted-foreground hover:text-foreground h-auto rounded-full px-3.5 py-1.5 font-normal whitespace-normal"
              disabled={disabled}
              onClick={() => onSuggestion(question)}
            >
              {question}
            </Button>
          </li>
        ))}
      </ul>

      {stats && stats.latest.length > 0 && (
        <section aria-labelledby="latest-heading" className="mt-16">
          <div className="flex items-baseline justify-between gap-4 border-b pb-3">
            <h2 id="latest-heading" className="text-sm font-medium">
              Latest in the index
            </h2>
            <Link href="/news" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
              See all news
            </Link>
          </div>
          <ol className="divide-y">
            {stats.latest.map((article) => (
              <li key={article.id}>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group focus-visible:ring-ring/50 flex flex-col gap-1 py-3.5 outline-none focus-visible:ring-3 sm:flex-row sm:items-baseline sm:gap-4"
                >
                  <span className="text-muted-foreground shrink-0 text-xs tabular-nums sm:w-24">
                    {article.sourceName}
                  </span>
                  <span className="text-foreground/90 group-hover:text-foreground flex-1 text-sm leading-snug transition-colors group-hover:underline group-hover:underline-offset-3">
                    {article.title}
                  </span>
                  {article.publishedAt && (
                    <time
                      dateTime={article.publishedAt}
                      suppressHydrationWarning
                      className="text-muted-foreground shrink-0 text-xs tabular-nums"
                    >
                      {formatRelativeTime(article.publishedAt)}
                    </time>
                  )}
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
