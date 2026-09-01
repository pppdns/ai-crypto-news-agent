import React from 'react';
import { cn } from '@heroui/react';

export interface Citation {
  url: string;
  title: string;
  sourceName: string;
  relativeDate: string;
}

export interface CitationsProps {
  citations: Citation[];
  className?: string;
}

export const Citations: React.FC<CitationsProps> = ({ citations, className = '' }) => {
  if (!citations || citations.length === 0) {
    return null;
  }

  return (
    <div className={cn('border-hairline mt-8 border-t pt-4', className)}>
      <h4 className="text-faint font-mono text-[11px] tracking-[0.18em]">EVIDENCE</h4>
      <ol className="mt-2">
        {citations.map((citation, index) => (
          <li key={`${citation.url}-${index}`}>
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group hover:bg-accent-dim -mx-1 flex min-h-11 items-start gap-3 rounded-md px-1 py-2.5 transition-colors"
            >
              <span className="text-accent w-8 shrink-0 pt-0.5 font-mono text-[11px]">
                [{String(index + 1).padStart(2, '0')}]
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-ink group-hover:text-accent block text-[13.5px] leading-snug">
                  {citation.title}
                </span>
                <span className="text-faint mt-1 flex flex-wrap gap-x-1.5 font-mono text-[11px] tracking-[0.04em]">
                  <span className="uppercase">{citation.sourceName}</span>
                  <span aria-hidden>·</span>
                  <span>{citation.relativeDate}</span>
                </span>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
};
