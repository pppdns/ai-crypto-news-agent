'use client';

import React from 'react';
import { cn } from '@heroui/react';
import { ArrowUp } from 'lucide-react';
import PromptInput from './prompt-input';

export const SUGGESTED_PROMPTS = [
  'Latest XRP news?',
  'How did Bitcoin perform this week?',
  'What is the latest news on the SEC vs Binance lawsuit?',
  "How did Trump's China tariff announcements affect Bitcoin prices?",
];

interface PromptInputWithBottomActionsProps {
  input: string;
  setInput: (value: string) => void;
  sendMessage: (text: string) => void;
  isLoading: boolean;
}

export default function PromptInputWithBottomActions({
  input,
  setInput,
  sendMessage,
  isLoading,
}: PromptInputWithBottomActionsProps) {
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const canAutofocus = window.matchMedia('(min-width: 640px) and (hover: hover) and (pointer: fine)').matches;
    if (canAutofocus) {
      inputRef.current?.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      sendMessage(input.trim());
    }
  };

  const canSend = Boolean(input.trim()) && !isLoading;

  return (
    <form
      className="border-hairline-strong bg-surface focus-within:border-accent/40 flex items-end gap-2 rounded-md border px-3 py-1.5 transition-colors"
      onSubmit={handleSubmit}
    >
      <PromptInput
        ref={inputRef}
        value={input}
        onValueChange={setInput}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        className="flex-1"
      />
      <button
        type="submit"
        disabled={!canSend}
        aria-label="Send message"
        className={cn(
          'mb-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-sm transition-colors',
          canSend ? 'bg-accent text-canvas hover:bg-accent/90' : 'bg-raised text-faint',
        )}
      >
        <ArrowUp className="h-4 w-4" strokeWidth={2.25} />
      </button>
    </form>
  );
}

export function SuggestedPrompts({ onSelect, isLoading }: { onSelect: (prompt: string) => void; isLoading: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
      {SUGGESTED_PROMPTS.map((idea, index) => (
        <button
          key={idea}
          type="button"
          disabled={isLoading}
          onClick={() => onSelect(idea)}
          className="group border-hairline hover:border-hairline-strong hover:bg-surface flex min-h-11 items-start gap-3 rounded-md border bg-transparent px-3 py-2.5 text-left transition-colors disabled:opacity-50"
        >
          <span className="text-accent pt-0.5 font-mono text-[11px]">[{String(index + 1).padStart(2, '0')}]</span>
          <span className="text-ink group-hover:text-accent text-[13.5px] leading-snug">{idea}</span>
        </button>
      ))}
    </div>
  );
}
