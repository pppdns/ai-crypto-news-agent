'use client';

/**
 * The /news article list: a search box and publisher filter above a single-column,
 * newest-first list (source, relative time, title linking to the article, summary).
 * Filtering runs in the browser over the articles the server page loaded.
 */
import { useDeferredValue, useMemo, useState } from 'react';
import { SearchIcon, XIcon } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { formatRelativeTime } from '@/lib/client/relative-time';

export interface NewsArticle {
  id: string;
  title: string | null;
  url: string;
  text_summary: string | null;
  published_at: string | null;
  source_name: string;
}

const ALL_SOURCES = 'all';

/** Publisher filter pill; the selected one uses the accent so the active filter is obvious */
const FILTER_PILL =
  'rounded-full px-3 font-normal text-muted-foreground data-[state=on]:border-primary/40 data-[state=on]:bg-primary/10 data-[state=on]:text-primary';

interface NewsListProps {
  articles: NewsArticle[];
  /** Articles in the whole index; more than `articles.length` when the page hit its load limit */
  totalCount: number;
  /** The server could not load articles (e.g. database unreachable) */
  loadFailed: boolean;
}

export function NewsList({ articles, totalCount, loadFailed }: NewsListProps) {
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<string>(ALL_SOURCES);
  const deferredQuery = useDeferredValue(query);

  const sources = useMemo(
    () => Array.from(new Set(articles.map((article) => article.source_name))).sort((a, b) => a.localeCompare(b)),
    [articles],
  );

  const filtered = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    return articles.filter((article) => {
      if (source !== ALL_SOURCES && article.source_name !== source) return false;
      if (!needle) return true;
      return (
        (article.title ?? '').toLowerCase().includes(needle) ||
        (article.text_summary ?? '').toLowerCase().includes(needle)
      );
    });
  }, [articles, deferredQuery, source]);

  const isFiltering = deferredQuery.trim() !== '' || source !== ALL_SOURCES;
  const clearFilters = () => {
    setQuery('');
    setSource(ALL_SOURCES);
  };

  return (
    <>
      <SiteHeader articleCount={loadFailed ? null : totalCount} />

      <main className="mx-auto w-full max-w-3xl px-4 pt-10 pb-20 sm:px-6">
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight">Latest news</h1>
        <p className="text-muted-foreground mt-2 text-[15px]">
          {loadFailed
            ? 'The article list is unavailable right now.'
            : articles.length === 0
              ? 'Articles the agent can cite appear here once the crawler has run.'
              : totalCount > articles.length
                ? `The newest ${articles.length.toLocaleString('en-US')} of ${totalCount.toLocaleString('en-US')} articles the agent can cite.`
                : `Every article the agent can cite, newest first, from ${sources.length} publishers.`}
        </p>

        {articles.length > 0 && (
          <div className="bg-background/85 sticky top-14 z-10 -mx-4 mt-8 flex flex-col gap-3 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
            <InputGroup className="h-10 rounded-xl">
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                aria-label="Search articles"
                placeholder="Search titles and summaries"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="[&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => setQuery('')}>
                    <XIcon />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>

            <div className="-mx-4 [scrollbar-width:none] overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                spacing={1.5}
                aria-label="Filter by publisher"
                value={source}
                onValueChange={(value) => setSource(value || ALL_SOURCES)}
              >
                <ToggleGroupItem value={ALL_SOURCES} className={FILTER_PILL}>
                  All publishers
                </ToggleGroupItem>
                {sources.map((name) => (
                  <ToggleGroupItem key={name} value={name} className={FILTER_PILL}>
                    {name}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>
        )}

        {articles.length > 0 && (
          <p className="text-muted-foreground mt-4 text-xs tabular-nums" aria-live="polite">
            {isFiltering
              ? `${filtered.length.toLocaleString('en-US')} of ${articles.length.toLocaleString('en-US')} articles`
              : `${articles.length.toLocaleString('en-US')} articles`}
          </p>
        )}

        {filtered.length > 0 ? (
          <ol className="mt-2 divide-y">
            {filtered.map((article) => (
              <ArticleRow key={article.id} article={article} />
            ))}
          </ol>
        ) : (
          <Empty className="mt-6 border">
            <EmptyHeader>
              <EmptyTitle>
                {loadFailed
                  ? "Couldn't load articles"
                  : articles.length === 0
                    ? 'No articles yet'
                    : 'No matching articles'}
              </EmptyTitle>
              <EmptyDescription>
                {loadFailed
                  ? 'The database did not respond. Check that Supabase is running and reload the page.'
                  : articles.length === 0
                    ? 'Run the crawler (pnpm tsx scripts/crawl-news.ts) or load mock data to fill the index.'
                    : 'Try a different search term or publisher.'}
              </EmptyDescription>
            </EmptyHeader>
            {isFiltering && (
              <EmptyContent>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              </EmptyContent>
            )}
          </Empty>
        )}
      </main>
    </>
  );
}

function ArticleRow({ article }: { article: NewsArticle }) {
  return (
    <li className="[contain-intrinsic-size:auto_8rem] [content-visibility:auto]">
      <article className="flex flex-col gap-1.5 py-5">
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <span className="text-foreground/80">{article.source_name}</span>
          {article.published_at && (
            <>
              <span aria-hidden className="text-muted-foreground/50">
                /
              </span>
              <time dateTime={article.published_at} suppressHydrationWarning className="tabular-nums">
                {formatRelativeTime(article.published_at)}
              </time>
            </>
          )}
        </div>
        <h2 className="text-base leading-snug font-medium text-pretty">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary focus-visible:ring-ring/50 rounded-sm outline-none focus-visible:ring-3"
          >
            {article.title || 'Untitled'}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </h2>
        {article.text_summary && (
          <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">{article.text_summary}</p>
        )}
      </article>
    </li>
  );
}
