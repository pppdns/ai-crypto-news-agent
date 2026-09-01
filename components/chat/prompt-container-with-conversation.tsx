'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@heroui/react';
import { Citation } from './citations';
import Conversation from './conversation';
import PromptInputWithBottomActions, { SuggestedPrompts } from './prompt-input-with-bottom-actions';

interface ErrorResponse {
  error?: string;
  message?: string;
}

interface StreamDataMessage {
  type: 'citations' | 'cleanedText' | 'error';
  citations?: Citation[];
  text?: string;
  message?: string;
}

function EmptyState() {
  return (
    <div>
      <p className="text-accent font-mono text-[11px] tracking-[0.22em]">CRYPTO NEWS AGENT</p>
      <h1 className="text-ink mt-3 max-w-xl text-[1.85rem] leading-[1.08] font-medium tracking-tight sm:text-[2.75rem]">
        Ask the tape.
      </h1>
      <p className="text-muted mt-3 max-w-md text-[14px] leading-relaxed sm:text-[15px]">
        Grounded answers from indexed crypto news. Every claim cited. Nothing invented.
      </p>
    </div>
  );
}

export default function PromptContainerWithConversation({ className }: { className?: string }) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [userQuestion, setUserQuestion] = useState('');
  const [assistantAnswer, setAssistantAnswer] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const isEmpty = !userQuestion && !assistantAnswer;

  useEffect(() => {
    if (isEmpty) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    bottomRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'end' });
  }, [assistantAnswer, isLoading, isEmpty]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

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
          const errorText = await response.text();
          let errorMessage = 'Request failed';
          try {
            const errorJson: ErrorResponse = JSON.parse(errorText);
            errorMessage = errorJson.message || errorJson.error || errorMessage;
          } catch {
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
                  const parsed: StreamDataMessage = JSON.parse(data);
                  if (parsed.type === 'error' && parsed.message) {
                    throw new Error(parsed.message);
                  } else if (parsed.type === 'citations' && parsed.citations) {
                    setCitations(parsed.citations);
                  } else if (parsed.type === 'cleanedText' && parsed.text) {
                    setAssistantAnswer(parsed.text);
                  }
                } catch {
                  accumulatedText += data;
                  setAssistantAnswer(accumulatedText);
                }
              } else if (line.trim()) {
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
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-[780px] flex-col px-4 sm:px-6">
          {isEmpty ? (
            <div className="flex flex-1 flex-col justify-center gap-7 py-8 sm:gap-8 sm:py-10">
              <EmptyState />
              <SuggestedPrompts onSelect={sendMessage} isLoading={isLoading} />
            </div>
          ) : (
            <div className="flex flex-col gap-8 py-6 sm:py-10">
              <Conversation
                userQuestion={userQuestion}
                assistantAnswer={assistantAnswer}
                isLoading={isLoading}
                citations={citations}
              />
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      <div className="border-hairline bg-canvas/90 border-t pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[780px] flex-col gap-2 px-4 pt-3 sm:px-6">
          <PromptInputWithBottomActions
            input={input}
            setInput={setInput}
            sendMessage={sendMessage}
            isLoading={isLoading}
          />
          <p className="text-faint flex flex-wrap items-center gap-x-1.5 px-1 pb-1 font-mono text-[10px] tracking-[0.08em]">
            <span>INDEXED FROM 29 OCT 2025</span>
            <span aria-hidden>·</span>
            <Link
              href="/news"
              className="text-muted decoration-hairline-strong hover:text-ink underline underline-offset-2"
            >
              View feed
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
