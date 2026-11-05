'use client';

/**
 * The question input: an auto-growing textarea with a send button, which turns into a
 * stop button while an answer is being generated. Enter sends, Shift+Enter adds a line.
 */
import { useEffect, useRef, useState } from 'react';
import { ArrowUpIcon, SquareIcon } from 'lucide-react';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from '@/components/ui/input-group';
import { cn } from '@/lib/utils';

interface ComposerProps {
  onSubmit: (question: string) => void;
  onStop: () => void;
  isBusy: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function Composer({ onSubmit, onStop, isBusy, autoFocus = false, className }: ComposerProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = value.trim().length > 0 && !isBusy;

  useEffect(() => {
    // Focus on desktop only, so phones don't pop the keyboard over the page on load.
    if (autoFocus && window.matchMedia('(pointer: fine)').matches) {
      textareaRef.current?.focus();
    }
  }, [autoFocus]);

  const submit = () => {
    if (!canSend) return;
    onSubmit(value);
    setValue('');
  };

  return (
    <form
      className={cn('w-full', className)}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <InputGroup
        className={cn(
          'bg-card dark:bg-card rounded-2xl shadow-lg shadow-black/25',
          // Quieter focus state than the default gold ring: the composer is almost always focused.
          'has-[[data-slot=input-group-control]:focus-visible]:border-foreground/25 has-[[data-slot=input-group-control]:focus-visible]:ring-foreground/5',
        )}
      >
        <InputGroupTextarea
          ref={textareaRef}
          aria-label="Ask a question about crypto news"
          placeholder="Ask about a coin, a company or an event"
          className="max-h-48 min-h-14 px-4 pt-3.5 text-[15px] md:text-[15px]"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              submit();
            }
          }}
        />
        <InputGroupAddon align="block-end" className="justify-between gap-3 px-3 pb-3">
          <span className="text-muted-foreground hidden text-xs font-normal sm:inline">
            Enter to send, Shift + Enter for a new line
          </span>
          {isBusy ? (
            <InputGroupButton
              type="button"
              variant="secondary"
              size="icon-sm"
              className="ml-auto rounded-full"
              onClick={onStop}
              aria-label="Stop answering"
            >
              <SquareIcon className="fill-current" />
            </InputGroupButton>
          ) : (
            <InputGroupButton
              type="submit"
              variant="default"
              size="icon-sm"
              className="disabled:bg-muted disabled:text-muted-foreground ml-auto rounded-full disabled:opacity-100"
              disabled={!canSend}
              aria-label="Send question"
            >
              <ArrowUpIcon />
            </InputGroupButton>
          )}
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
