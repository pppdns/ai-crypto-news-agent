'use client';

import { useCallback, useState } from 'react';
import { ScrollShadow } from '@heroui/react';
import { cn } from '@heroui/react';
import type { UIMessage } from 'ai';
import { Citation } from './citations';
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
  const [citations, setCitations] = useState<Citation[]>([]);
  const [messages, setMessages] = useState<UIMessage[]>([]);

  const sendMessage = useCallback(
    async (message: { role: 'user' | 'assistant'; parts: Array<{ type: 'text'; text: string }> }) => {
      const messageContent = message.parts.find((p) => p.type === 'text')?.text || '';
      if (!messageContent.trim() || isLoading) return;

      // Add user message
      const userMessage: UIMessage = {
        id: Date.now().toString(),
        role: 'user',
        parts: [{ type: 'text', text: messageContent }],
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setInput('');

      // Create assistant message placeholder
      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: UIMessage = {
        id: assistantMessageId,
        role: 'assistant',
        parts: [{ type: 'text', text: '' }],
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        // Convert UIMessage format to simple format for backend
        const simpleMessages = [...messages, userMessage].map((message) => ({
          role: message.role,
          content: message.parts.find((p) => p.type === 'text')?.text || '',
        }));

        const response = await fetch('/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: simpleMessages,
          }),
        });

        if (!response.ok) {
          // Try to get error message from response
          const errorText = await response.text();
          let errorMessage = 'Request failed';
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorJson.error || errorMessage;
          } catch {
            // Not JSON, use status text
            errorMessage = `Request failed: ${response.status} ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.type === 'citations' && parsed.citations) {
                    setCitations(parsed.citations);
                  }
                } catch {
                  // Not JSON, treat as text
                  accumulatedText += data;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, parts: [{ type: 'text', text: accumulatedText }] }
                        : msg,
                    ),
                  );
                }
              } else if (line.trim()) {
                // Plain text chunk
                accumulatedText += line;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId ? { ...msg, parts: [{ type: 'text', text: accumulatedText }] } : msg,
                  ),
                );
              }
            }
          }
        }
      } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, parts: [{ type: 'text', text: `Error: ${errorMessage}` }] } : msg,
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading],
  );

  return (
    <div className={cn('flex w-full max-w-full flex-col gap-24', className)}>
      <ScrollShadow className={cn('flex h-full flex-col', scrollShadowClassname)}>
        <Conversation messages={messages} isLoading={isLoading} citations={citations} />
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
