'use client';

import React from 'react';
import { cn } from '@heroui/react';

export type MessageCardProps = React.HTMLAttributes<HTMLDivElement> & {
  role: 'user' | 'assistant';
  message?: React.ReactNode;
  status?: 'success' | 'failed';
};

const MessageCard = React.forwardRef<HTMLDivElement, MessageCardProps>(
  ({ role, message, status, className, ...props }, ref) => {
    const hasFailed = status === 'failed';
    const label = role === 'user' ? 'YOU' : 'AGENT';

    return (
      <div {...props} ref={ref} className={cn('flex gap-3 sm:gap-4', className)}>
        <div className="flex w-10 shrink-0 flex-col items-start sm:w-14">
          <span
            className={cn(
              'font-mono text-[10px] tracking-[0.18em]',
              role === 'assistant' ? 'text-accent' : 'text-muted',
            )}
          >
            {label}
          </span>
          <span
            className={cn('mt-2 w-px flex-1', role === 'assistant' ? 'bg-accent/55' : 'bg-hairline-strong')}
            aria-hidden
          />
        </div>
        <div
          className={cn(
            'text-ink min-w-0 flex-1 pt-px text-[15px] leading-relaxed',
            hasFailed && 'border-danger/30 bg-danger/10 text-danger rounded-md border px-3 py-2',
          )}
        >
          {hasFailed ? <p>Something went wrong</p> : message}
        </div>
      </div>
    );
  },
);

export default MessageCard;

MessageCard.displayName = 'MessageCard';
