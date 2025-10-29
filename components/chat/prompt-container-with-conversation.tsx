'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { ScrollShadow } from '@heroui/react';
import { cn } from '@heroui/react';
import { DefaultChatTransport } from 'ai';
import Conversation from './conversation';
import PromptInputWithBottomActions from './prompt-input-with-bottom-actions';

export default function Component({
  className,
  scrollShadowClassname,
}: {
  className?: string;
  scrollShadowClassname?: string;
}) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: '/ask',
    }),
  });

  return (
    <div className={cn('flex w-full max-w-full flex-col gap-24', className)}>
      <ScrollShadow className={cn('flex h-full flex-col', scrollShadowClassname)}>
        <Conversation messages={messages} isLoading={isLoading} />
      </ScrollShadow>
      <div className="flex flex-col gap-2">
        <PromptInputWithBottomActions
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
          messages={messages}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
        <p className="text-tiny text-default-400 px-2">
          AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
}
