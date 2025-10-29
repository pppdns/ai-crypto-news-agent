'use client';

import React from 'react';
import { Button, ScrollShadow, Tooltip } from '@heroui/react';
import { cn } from '@heroui/react';
import { ArrowUp } from 'lucide-react';
import PromptInput from './prompt-input';

export default function Component() {
  const ideas = [
    'Bitcoin price changes from US-China relations',
    'What is the latest news on the SEC vs Binance lawsuit?',
    'How to spot bull and bear market traps in crypto?',
    'What are the recent Norwegian tax changes related to crypto?',
  ];

  const [prompt, setPrompt] = React.useState<string>('');

  return (
    <div className="flex w-full flex-col gap-4">
      <ScrollShadow hideScrollBar className="flex flex-nowrap gap-2" orientation="horizontal">
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          {ideas.map((idea, index) => (
            <div key={index} className="h-10 text-left text-sm">
              <Button className="h-10 w-full text-left text-sm" variant="flat">
                <p>{idea}</p>
              </Button>
            </div>
          ))}
        </div>
      </ScrollShadow>
      <form className="rounded-medium bg-default-100 hover:bg-default-200/70 flex w-full flex-col items-start transition-colors">
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
                  color={!prompt ? 'default' : 'primary'}
                  isDisabled={!prompt}
                  radius="lg"
                  size="sm"
                  variant="solid"
                >
                  <ArrowUp
                    className={cn('[&>path]:stroke-[2px]', !prompt ? 'text-default-600' : 'text-primary-foreground')}
                    width={20}
                  />
                </Button>
              </Tooltip>
            </div>
          }
          minRows={3}
          radius="lg"
          value={prompt}
          variant="flat"
          onValueChange={setPrompt}
        />
      </form>
    </div>
  );
}
