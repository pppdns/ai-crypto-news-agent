/**
 * The list of articles an answer cites, shown under the answer as linked cards
 * (title, source, date). Data comes from the `citations` event of POST /ask.
 */
import { ArrowUpRightIcon } from 'lucide-react';
import { Item, ItemActions, ItemContent, ItemDescription } from '@/components/ui/item';
import type { Citation } from '@/lib/client/types';

export function Citations({ citations }: { citations: Citation[] }) {
  if (citations.length === 0) return null;

  return (
    <section aria-label="Sources" className="flex flex-col gap-2.5">
      <h3 className="text-muted-foreground text-xs font-medium">
        {citations.length === 1 ? '1 source' : `${citations.length} sources`}
      </h3>
      <ul className="grid gap-2 sm:grid-cols-2">
        {citations.map((citation) => (
          <li key={citation.articleId} className="flex">
            <Item asChild variant="outline" className="items-start">
              <a href={citation.url} target="_blank" rel="noopener noreferrer">
                <ItemContent className="gap-1">
                  <ItemDescription className="text-xs">
                    <span className="text-foreground/80">{citation.sourceName}</span>
                    <span className="text-muted-foreground/60 px-1.5">/</span>
                    {citation.relativeDate}
                  </ItemDescription>
                  <span data-slot="item-title" className="text-foreground line-clamp-2 text-sm leading-snug">
                    {citation.title}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </span>
                </ItemContent>
                <ItemActions className="text-muted-foreground group-hover/item:text-foreground self-start transition-colors">
                  <ArrowUpRightIcon className="size-4" />
                </ItemActions>
              </a>
            </Item>
          </li>
        ))}
      </ul>
    </section>
  );
}
