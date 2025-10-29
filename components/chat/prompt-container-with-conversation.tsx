'use client';

import React from 'react';
import { ScrollShadow } from '@heroui/react';
import { cn } from '@heroui/react';
import Conversation from './conversation';
import PromptInputWithBottomActions from './prompt-input-with-bottom-actions';

export default function Component({
  className,
  scrollShadowClassname,
}: {
  className?: string;
  scrollShadowClassname?: string;
}) {
  return (
    <div className={cn('flex w-full max-w-full flex-col gap-24', className)}>
      <ScrollShadow className={cn('flex h-full flex-col', scrollShadowClassname)}>
        <Conversation />
      </ScrollShadow>
      <div className="flex flex-col gap-2">
        <PromptInputWithBottomActions />
        <p className="text-tiny text-default-400 px-2">
          AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
}
