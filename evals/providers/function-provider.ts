/**
 * PromptFoo provider for deterministic (code-graded, zero-cost) evals (evals/deterministic.yaml).
 * Runs a pure pipeline function on the prompt and returns its result as a string, no LLM involved.
 *
 * Config:
 *   fn: 'temporalWindow' → days of the recency window detected in the query (e.g. "7")
 *       'rerankScore'    → parsed reranker score, or "null" when the reply is rejected
 */
import type { ApiProvider, ProviderOptions, ProviderResponse } from 'promptfoo';
import { parseRerankScore } from '../../lib/server/rag/reranker';
import { detectTemporalWindow } from '../../lib/server/rag/temporal-detection';

type FunctionName = 'temporalWindow' | 'rerankScore';

const FUNCTIONS: Record<FunctionName, (input: string) => string> = {
  temporalWindow: (input) => String(detectTemporalWindow(input).days),
  rerankScore: (input) => String(parseRerankScore(input)),
};

export default class FunctionProvider implements ApiProvider {
  private readonly fn: FunctionName;

  constructor(options: ProviderOptions<{ fn?: FunctionName }> = {}) {
    const fn = options.config?.fn;
    if (!fn || !(fn in FUNCTIONS)) {
      throw new Error(`function-provider: config.fn must be one of ${Object.keys(FUNCTIONS).join(', ')}`);
    }
    this.fn = fn;
  }

  id(): string {
    return `function:${this.fn}`;
  }

  async callApi(prompt: string): Promise<ProviderResponse> {
    return { output: FUNCTIONS[this.fn](prompt) };
  }
}
