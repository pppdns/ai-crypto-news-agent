/**
 * One question/answer exchange in the thread: the user's question bubble, then the
 * assistant's progress line, streamed answer, sources, or an error with a retry action.
 */
import Link from 'next/link';
import { CircleStopIcon, SearchIcon, SparklesIcon } from 'lucide-react';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Button } from '@/components/ui/button';
import { Marker, MarkerContent, MarkerIcon } from '@/components/ui/marker';
import { Message, MessageContent } from '@/components/ui/message';
import { MessageScrollerItem } from '@/components/ui/message-scroller';
import { Trace, TraceIcon, TraceLine, TraceTitle } from '@/components/ui/trace';
import { Answer } from './answer';
import { Citations } from './citations';
import type { Turn as TurnData } from './use-ask';

/** Exact reply the backend sends when retrieval finds nothing (see lib/server/rag/prompts.ts) */
const NO_NEWS_ANSWER = 'No recent news';

interface TurnProps {
  turn: TurnData;
  onRetry: (id: string) => void;
  canRetry: boolean;
}

export function Turn({ turn, onRetry, canRetry }: TurnProps) {
  const isNoNews = turn.status === 'done' && turn.answer.replace(/[".]/g, '').trim() === NO_NEWS_ANSWER;

  return (
    <>
      <MessageScrollerItem messageId={`${turn.id}-question`} scrollAnchor>
        <Message align="end">
          <MessageContent>
            <Bubble variant="secondary" align="end">
              <BubbleContent className="rounded-2xl px-4 py-2.5 text-[15px] whitespace-pre-wrap">
                {turn.question}
              </BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
      </MessageScrollerItem>

      <MessageScrollerItem messageId={`${turn.id}-answer`}>
        <Message align="start">
          <MessageContent className="gap-5">
            {(turn.status === 'searching' || turn.status === 'answering') && (
              <Trace aria-live="polite">
                <TraceLine status="running">
                  <TraceIcon>{turn.status === 'searching' ? <SearchIcon /> : <SparklesIcon />}</TraceIcon>
                  <TraceTitle>
                    {turn.status === 'searching' ? 'Searching recent articles' : 'Writing the answer'}
                  </TraceTitle>
                </TraceLine>
              </Trace>
            )}

            {isNoNews ? (
              <div className="flex flex-col gap-1 text-[15px]">
                <p className="font-medium">No recent news</p>
                <p className="text-muted-foreground">
                  None of the indexed articles cover this. Try different keywords, or{' '}
                  <Link href="/news" className="text-foreground hover:text-primary underline underline-offset-3">
                    browse the latest news
                  </Link>
                  .
                </p>
              </div>
            ) : (
              turn.answer && <Answer markdown={turn.answer} />
            )}

            {turn.status === 'stopped' && (
              <Marker>
                <MarkerIcon>
                  <CircleStopIcon />
                </MarkerIcon>
                <MarkerContent>Stopped before the answer was finished.</MarkerContent>
              </Marker>
            )}

            {turn.status === 'error' && (
              <Alert variant="destructive">
                <AlertTitle>Couldn&apos;t answer this question</AlertTitle>
                <AlertDescription>{turn.error}</AlertDescription>
                <AlertAction>
                  <Button variant="outline" size="sm" disabled={!canRetry} onClick={() => onRetry(turn.id)}>
                    Try again
                  </Button>
                </AlertAction>
              </Alert>
            )}

            {turn.status === 'done' && !isNoNews && <Citations citations={turn.citations} />}
          </MessageContent>
        </Message>
      </MessageScrollerItem>
    </>
  );
}
