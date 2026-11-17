/**
 * PromptFoo provider for the answer step of the RAG pipeline (evals/generation.yaml, evals/redteam.yaml).
 *
 * Calls the production `generateAnswerStream` (same prompt, same default model as `/ask`) on frozen
 * fixture chunks, so generation quality is measured without a database or a moving news corpus.
 * The PromptFoo prompt is the user question; `vars.articles` picks the fixture articles and
 * `vars.inject` optionally plants an extra chunk (used for indirect prompt-injection tests).
 *
 * Config:
 *   gatewayModel: optional Vercel AI Gateway model id (e.g. 'anthropic/claude-haiku-5.5') to compare
 *                 against the production model. Needs AI_GATEWAY_API_KEY.
 */
import { startActiveObservation } from '@langfuse/tracing';
import { gateway } from 'ai';
import type { ApiProvider, CallApiContextParams, ProviderOptions, ProviderResponse } from 'promptfoo';
import { ANSWER_MODEL_ID, generateAnswerStream } from '../../lib/server/rag/answer';
import { flushTraces } from '../../lib/server/tracing';
import { buildContextChunks } from '../fixtures/contexts';
import { setupEvalRuntime } from './setup';

interface AnswerProviderConfig {
  gatewayModel?: string;
}

/** Default context for red-team runs, which only supply the attack prompt. */
const DEFAULT_ARTICLES = ['solana-etf-application-submitted-sec', 'bitcoin-reaches-new-all-time-high-95000'];

function asStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.map(String) : undefined;
}

export default class AnswerProvider implements ApiProvider {
  readonly config: AnswerProviderConfig;
  readonly label?: string;

  constructor(options: ProviderOptions<AnswerProviderConfig> = {}) {
    this.config = options.config ?? {};
    this.label = options.label;
    setupEvalRuntime();
  }

  id(): string {
    return this.label ?? `rag-answer:${this.config.gatewayModel ?? ANSWER_MODEL_ID}`;
  }

  async callApi(prompt: string, context?: CallApiContextParams): Promise<ProviderResponse> {
    const vars = context?.vars ?? {};
    const articles = asStringArray(vars.articles) ?? DEFAULT_ARTICLES;
    const inject = typeof vars.inject === 'string' ? vars.inject : undefined;
    const modelName = this.config.gatewayModel ?? ANSWER_MODEL_ID;

    try {
      const chunks = buildContextChunks(articles, { inject });
      const start = Date.now();

      const { text, usage } = await startActiveObservation(
        'eval-answer',
        async (span) => {
          const result = generateAnswerStream(prompt, chunks, {
            model: this.config.gatewayModel ? gateway(this.config.gatewayModel) : undefined,
            functionId: 'eval-answer-generation',
            metadata: { model: modelName },
          });
          const output = { text: await result.text, usage: await result.usage };
          span.update({ input: { question: prompt, articles }, output: output.text, metadata: { model: modelName } });
          return output;
        },
        { asType: 'agent' },
      );
      await flushTraces();

      return {
        output: text,
        latencyMs: Date.now() - start,
        tokenUsage: {
          prompt: usage.inputTokens ?? 0,
          completion: usage.outputTokens ?? 0,
          total: usage.totalTokens ?? 0,
        },
        metadata: { contextArticleIds: chunks.map((c) => c.article_id), model: modelName },
      };
    } catch (error) {
      return { error: `Answer generation failed: ${error instanceof Error ? error.message : String(error)}` };
    }
  }
}
