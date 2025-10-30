'use client';

import { useCallback, useState } from 'react';
import { ScrollShadow } from '@heroui/react';
import { cn } from '@heroui/react';
import { TriangleAlert } from 'lucide-react';
import { Citation } from './citations';
import Conversation from './conversation';
import PromptInputWithBottomActions from './prompt-input-with-bottom-actions';

interface ErrorResponse {
  error?: string;
  message?: string;
}

interface CitationData {
  type: string;
  citations?: Citation[];
}

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
  const [userQuestion, setUserQuestion] = useState('');
  const [assistantAnswer, setAssistantAnswer] = useState('');

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      // Clear previous state and set new question
      setUserQuestion(text);
      setAssistantAnswer('');
      setCitations([]);
      setIsLoading(true);
      setInput('');

      try {
        const response = await fetch('/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: text,
          }),
        });

        if (!response.ok) {
          // Try to get error message from response
          const errorText = await response.text();
          let errorMessage = 'Request failed';
          try {
            const errorJson: ErrorResponse = JSON.parse(errorText);
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
                  const parsed: CitationData = JSON.parse(data);
                  if (parsed.type === 'citations' && parsed.citations) {
                    setCitations(parsed.citations);
                  }
                } catch {
                  // Not JSON, treat as text
                  accumulatedText += data;
                  setAssistantAnswer(accumulatedText);
                }
              } else if (line.trim()) {
                // Plain text chunk
                accumulatedText += line;
                setAssistantAnswer(accumulatedText);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
        setAssistantAnswer(`Error: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading],
  );

  return (
    <div className={cn('flex w-full max-w-full flex-col gap-24', className)}>
      <ScrollShadow className={cn('flex h-full flex-col', scrollShadowClassname)}>
        <Conversation
          userQuestion={userQuestion}
          assistantAnswer={assistantAnswer}
          isLoading={isLoading}
          citations={citations}
        />
      </ScrollShadow>
      <div className="flex flex-col gap-2">
        <PromptInputWithBottomActions
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
          isLoading={isLoading}
        />
        <p className="text-tiny mt-2 flex items-center gap-1 px-2 font-semibold text-amber-500">
          <TriangleAlert className="mr-1 inline-block h-4 w-4" />
          Only news articles since <span className="underline">Oct 29, 2025</span> are included in the database.
          <a href="/news" className="underline">
            View all articles
          </a>
        </p>
      </div>
    </div>
  );
}
