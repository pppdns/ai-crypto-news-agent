'use client';

/**
 * The chat screen. Starts on the empty state (headline, composer, suggestions); after the
 * first question it becomes a scrolling thread with the composer pinned to the bottom and
 * the not-yet-asked suggestions in a row above it.
 */
import Link from 'next/link';
import { SquarePenIcon } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/ui/message-scroller';
import { formatShortDate } from '@/lib/client/relative-time';
import type { IndexStats } from '@/lib/client/types';
import { Composer } from './composer';
import { EmptyState } from './empty-state';
import { SuggestedQuestions } from './suggested-questions';
import { Turn } from './turn';
import { useAsk } from './use-ask';

export function Chat({ stats }: { stats: IndexStats | null }) {
  const { turns, isBusy, ask, retry, stop, reset } = useAsk();
  const hasTurns = turns.length > 0;

  const composer = <Composer onSubmit={ask} onStop={stop} isBusy={isBusy} autoFocus />;

  return (
    <div className="flex h-dvh flex-col">
      <SiteHeader
        articleCount={stats?.articleCount}
        actions={
          hasTurns && (
            <Button variant="ghost" size="sm" onClick={reset} aria-label="New chat">
              <SquarePenIcon data-icon="inline-start" />
              <span className="max-sm:hidden">New chat</span>
            </Button>
          )
        }
      />

      {hasTurns ? (
        <>
          <MessageScrollerProvider autoScroll>
            <MessageScroller className="flex-1">
              <MessageScrollerViewport>
                <MessageScrollerContent className="mx-auto w-full max-w-3xl gap-8 px-4 pt-8 pb-10 sm:px-6">
                  {turns.map((turn) => (
                    <Turn key={turn.id} turn={turn} onRetry={retry} canRetry={!isBusy} />
                  ))}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>

          <div className="mx-auto w-full max-w-3xl px-4 pb-4 sm:px-6">
            <SuggestedQuestions
              compact
              onSelect={ask}
              disabled={isBusy}
              asked={turns.map((turn) => turn.question)}
              className="mb-2.5"
            />
            {composer}
            <CoverageNote stats={stats} />
          </div>
        </>
      ) : (
        <main className="flex-1 overflow-y-auto">
          <EmptyState stats={stats} composer={composer} onSuggestion={ask} disabled={isBusy} />
        </main>
      )}
    </div>
  );
}

function CoverageNote({ stats }: { stats: IndexStats | null }) {
  return (
    <p className="text-muted-foreground mt-2.5 text-center text-xs">
      Answers only use indexed articles
      {stats?.oldestPublishedAt ? `, published since ${formatShortDate(stats.oldestPublishedAt)}` : ''}.{' '}
      <Link href="/news" className="hover:text-foreground underline underline-offset-3">
        Browse them
      </Link>
    </p>
  );
}
