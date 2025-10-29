'use client';

import React from 'react';
import { Avatar, Badge } from '@heroui/react';
import { cn } from '@heroui/react';
import { CircleAlert } from 'lucide-react';

export type MessageCardProps = React.HTMLAttributes<HTMLDivElement> & {
  avatar?: string;
  message?: React.ReactNode;
  status?: 'success' | 'failed';
  messageClassName?: string;
};

const MessageCard = React.forwardRef<HTMLDivElement, MessageCardProps>(
  ({ avatar, message, status, className, messageClassName, ...props }, ref) => {
    const messageRef = React.useRef<HTMLDivElement>(null);

    const failedMessageClassName =
      status === 'failed' ? 'bg-danger-100/50 border border-danger-100 text-foreground' : '';
    const failedMessage = <p>Something went wrong</p>;

    const hasFailed = status === 'failed';

    return (
      <div {...props} ref={ref} className={cn('flex gap-3', className)}>
        <div className="relative flex-none">
          <Badge
            isOneChar
            color="danger"
            content={<CircleAlert className="text-background" />}
            isInvisible={!hasFailed}
            placement="bottom-right"
            shape="circle"
          >
            <Avatar src={avatar} />
          </Badge>
        </div>
        <div className="flex w-full flex-col gap-4">
          <div
            className={cn(
              'rounded-large bg-content2 text-default-600 relative w-full px-3 md:p-6',
              failedMessageClassName,
              messageClassName,
            )}
          >
            <div ref={messageRef} className={'text-small p-2'}>
              {hasFailed ? failedMessage : message}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export default MessageCard;

MessageCard.displayName = 'MessageCard';
