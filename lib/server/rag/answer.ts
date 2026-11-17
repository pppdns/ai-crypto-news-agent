/**
 * Answer generation for the RAG pipeline.
 *
 * Shared by the `/ask` route handler and the PromptFoo evals (`evals/providers/answer-provider.ts`),
 * so the prompt and model under evaluation are exactly the ones used in production.
 *
 * Usage:
 *   const result = generateAnswerStream(query, chunks);
 *   for await (const token of result.textStream) { ... }
 */
import { openai } from '@ai-sdk/openai';
import { type LanguageModel, streamText } from 'ai';
import { getAnswerPrompt } from './prompts';
import type { Chunk } from './types';

/**
 * Production answer model.
 * gpt-5-chat-latest was removed from the API on 2026-07-23.
 * Terra is enough here: the model only has to summarize retrieved chunks and cite them.
 */
export const ANSWER_MODEL_ID = 'gpt-5.6-terra';

/** Exact answer the assistant must give when the context does not answer the question. */
export const NO_RECENT_NEWS = 'No recent news';

export interface GenerateAnswerOptions {
  /** Override the answer model (used by evals to compare models). Defaults to the production model. */
  model?: LanguageModel;
  /** Name stored on the trace span, e.g. to tell eval runs from production traffic. */
  functionId?: string;
  /** Extra trace metadata (strings only, as required by OpenTelemetry attributes). */
  metadata?: Record<string, string>;
}

/**
 * Stream a grounded, cited answer for the query using only the given chunks.
 * AI SDK telemetry is enabled so the generation (prompt, tokens, cost) shows up in Langfuse.
 */
export function generateAnswerStream(query: string, chunks: Chunk[], options: GenerateAnswerOptions = {}) {
  return streamText({
    model: options.model ?? openai(ANSWER_MODEL_ID),
    prompt: getAnswerPrompt(query, chunks),
    experimental_telemetry: {
      isEnabled: true,
      functionId: options.functionId ?? 'answer-generation',
      metadata: options.metadata,
    },
  });
}
