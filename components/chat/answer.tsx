/**
 * Renders the model's markdown answer as sanitized HTML.
 */
import { useMemo } from 'react';
import sanitizeHtml from 'sanitize-html';
import { markdownToHTML } from '@/lib/client/markdown-to-html';
import { cn } from '@/lib/utils';

export function Answer({ markdown, className }: { markdown: string; className?: string }) {
  const html = useMemo(() => sanitizeHtml(markdownToHTML(markdown)), [markdown]);

  return (
    <div
      className={cn(
        'prose prose-answer prose-p:my-3 prose-a:underline-offset-3 prose-li:my-1 prose-ol:my-3 prose-ul:my-3 first:prose-p:mt-0 max-w-none text-[15px] leading-7',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
