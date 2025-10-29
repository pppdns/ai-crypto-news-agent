'use client';

import React from 'react';
import { Button, ScrollShadow, Tooltip } from '@heroui/react';
import { cn } from '@heroui/react';
import { UIMessage } from 'ai';
import { ArrowUp } from 'lucide-react';
import PromptInput from './prompt-input';

interface PromptInputWithBottomActionsProps {
  input: string;
  setInput: (value: string) => void;
  sendMessage: (message: { role: 'user' | 'assistant'; parts: Array<{ type: 'text'; text: string }> }) => void;
  messages: UIMessage[];
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function Component({
  input,
  setInput,
  sendMessage,
  messages,
  isLoading,
  setIsLoading,
}: PromptInputWithBottomActionsProps) {
  const ideas = [
    'Bitcoin price changes from US-China relations?',
    'What is the latest news on the SEC vs Binance lawsuit?',
    'How to spot bull and bear market traps in crypto?',
    'What are the recent Norwegian tax changes related to crypto?',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Send the user message
    sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: userMessage }],
    });
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isLoading) return;

    setInput(suggestion);
    setIsLoading(true);

    // Send the suggestion immediately
    sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: suggestion }],
    });
  };

  // Reset loading state when we get a response
  React.useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && isLoading) {
      setIsLoading(false);
    }
  }, [messages, isLoading, setIsLoading]);

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
          classNames={{
            inputWrapper: 'bg-transparent! shadow-none',
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
          variant="flat"
          onValueChange={setInput}
          isDisabled={isLoading}
        />
      </form>
    </div>
  );
}
