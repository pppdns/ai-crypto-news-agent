'use client';

import React from 'react';
import { Button, ScrollShadow, Tooltip } from '@heroui/react';
import { cn } from '@heroui/react';
import { ArrowUp } from 'lucide-react';
import PromptInput from './prompt-input';

interface PromptInputWithBottomActionsProps {
  input: string;
  setInput: (value: string) => void;
  sendMessage: (text: string) => void;
  isLoading: boolean;
}

export default function Component({ input, setInput, sendMessage, isLoading }: PromptInputWithBottomActionsProps) {
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const ideas = [
    'Latest Bitcoin news?',
    'How did XRP perform this week?',
    'What is the latest news on the SEC vs Binance lawsuit?',
    'What are the recent Norwegian tax changes related to crypto?',
  ];

  // Auto-focus the input on page load
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    sendMessage(userMessage);
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isLoading) return;
    sendMessage(suggestion);
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <ScrollShadow hideScrollBar className="flex flex-nowrap gap-2" orientation="horizontal">
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          {ideas.map((idea, index) => (
            <div key={index} className="text-left text-sm">
              <Button
                className="h-8 w-full bg-gray-100 text-left text-sm"
                variant="flat"
                size="sm"
                isDisabled={isLoading}
                onPress={() => handleSuggestionClick(idea)}
              >
                <p>{idea}</p>
              </Button>
            </div>
          ))}
        </div>
      </ScrollShadow>
      <form
        className="rounded-large bg-default-100 hover:bg-default-200/70 flex w-full flex-col items-start transition-colors"
        onSubmit={handleSubmit}
      >
        <PromptInput
          ref={inputRef}
          classNames={{
            inputWrapper: 'bg-transparent! shadow-none border-gray-200 ',
            innerWrapper: 'relative',
            input: 'pt-1 pl-2 pb-6 pr-10! text-medium',
          }}
          endContent={
            <div className="flex items-end gap-2">
              <Tooltip showArrow content="Send message">
                <Button
                  isIconOnly
                  type="submit"
                  color={!input || isLoading ? 'default' : 'primary'}
                  isDisabled={!input || isLoading}
                  isLoading={isLoading}
                  radius="lg"
                  size="sm"
                  variant="solid"
                >
                  {!isLoading && (
                    <ArrowUp
                      className={cn(
                        '[&>path]:stroke-[2px]',
                        !input || isLoading ? 'text-default-600' : 'text-primary-foreground',
                      )}
                      width={20}
                    />
                  )}
                </Button>
              </Tooltip>
            </div>
          }
          minRows={3}
          radius="lg"
          value={input}
          variant="bordered"
          onValueChange={setInput}
          isDisabled={isLoading}
        />
      </form>
    </div>
  );
}
