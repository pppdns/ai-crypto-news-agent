'use client';

/**
 * Client-side state for the chat: a list of question/answer turns kept for the session.
 *
 * Each question is sent to POST /ask on its own (the backend is single-turn); earlier
 * turns only stay on screen. One request runs at a time and can be stopped.
 *
 * Usage:
 *   const { turns, isBusy, ask, stop, retry, reset } = useAsk();
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { getAskErrorMessage, parseAskStream } from '@/lib/client/ask-stream';
import type { Citation } from '@/lib/client/types';

export type TurnStatus = 'searching' | 'answering' | 'done' | 'stopped' | 'error';

export interface Turn {
  id: string;
  question: string;
  answer: string;
  citations: Citation[];
  status: TurnStatus;
  error?: string;
}

export function useAsk() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const controllerRef = useRef<AbortController | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const updateTurn = useCallback((id: string, patch: Partial<Turn>) => {
    setTurns((current) => current.map((turn) => (turn.id === id ? { ...turn, ...patch } : turn)));
  }, []);

  const run = useCallback(
    async (id: string, question: string) => {
      const controller = new AbortController();
      controllerRef.current = controller;
      setIsBusy(true);

      try {
        const response = await fetch('/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: question }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(getAskErrorMessage(await response.text(), response.status));
        }
        if (!response.body) {
          throw new Error('The server sent an empty response.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let raw = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          raw += decoder.decode(value, { stream: true });
          const parsed = parseAskStream(raw);
          if (parsed.error) throw new Error(parsed.error);
          updateTurn(id, { answer: parsed.answer, status: parsed.answer.trim() ? 'answering' : 'searching' });
        }

        raw += decoder.decode();
        const parsed = parseAskStream(raw);
        if (parsed.error) throw new Error(parsed.error);
        updateTurn(id, { answer: parsed.answer.trim(), citations: parsed.citations ?? [], status: 'done' });
      } catch (error) {
        if (controller.signal.aborted) {
          updateTurn(id, { status: 'stopped' });
        } else {
          console.error('Error asking question:', error);
          updateTurn(id, {
            status: 'error',
            error: error instanceof Error ? error.message : 'Something went wrong while answering.',
          });
        }
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
          setIsBusy(false);
        }
      }
    },
    [updateTurn],
  );

  const ask = useCallback(
    (text: string) => {
      const question = text.trim();
      if (!question || controllerRef.current) return;

      const id = crypto.randomUUID();
      setTurns((current) => [...current, { id, question, answer: '', citations: [], status: 'searching' }]);
      void run(id, question);
    },
    [run],
  );

  const retry = useCallback(
    (id: string) => {
      const turn = turns.find((t) => t.id === id);
      if (!turn || controllerRef.current) return;
      updateTurn(id, { answer: '', citations: [], status: 'searching', error: undefined });
      void run(id, turn.question);
    },
    [run, turns, updateTurn],
  );

  const stop = useCallback(() => controllerRef.current?.abort(), []);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    setTurns([]);
  }, []);

  // Abort an in-flight request when the chat unmounts.
  useEffect(() => () => controllerRef.current?.abort(), []);

  return { turns, isBusy, ask, retry, stop, reset };
}
