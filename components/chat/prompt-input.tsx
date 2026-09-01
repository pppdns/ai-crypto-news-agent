'use client';

import React from 'react';
import { cn } from '@heroui/react';

type PromptInputProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> & {
  onValueChange?: (value: string) => void;
};

const PromptInput = React.forwardRef<HTMLTextAreaElement, PromptInputProps>(
  ({ className, onValueChange, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        aria-label="Prompt"
        rows={1}
        className={cn(
          'text-ink placeholder:text-muted min-h-11 w-full resize-none bg-transparent py-2.5 text-base leading-relaxed focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        placeholder="Ask about the latest crypto news"
        onChange={(event) => onValueChange?.(event.target.value)}
        {...props}
      />
    );
  },
);

export default PromptInput;

PromptInput.displayName = 'PromptInput';
