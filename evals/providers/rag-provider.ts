/**
 * PromptFoo provider for the retrieval half of the RAG pipeline (evals/retrieval.yaml).
 *
 * Runs the production LangGraph workflow (temporal detection → embedding → hybrid search → rerank)
 * against the local Supabase database and returns the ranked article URLs as JSON:
 *   { "temporalWindowDays": 7, "urls": ["https://...", ...] }
 * URLs are de-duplicated (several chunks can come from one article) and keep their rank order.
 *
 * Requires `pnpm supabase:start`, `pnpm tsx scripts/mock-ingest.ts --rebase-dates` and OPENAI_API_KEY.
 */
import type { ApiProvider, ProviderResponse } from 'promptfoo';
import { executeRAGWorkflow } from '../../lib/server/rag/workflow';
import { flushTraces } from '../../lib/server/tracing';
import { setupEvalRuntime } from './setup';

export interface RetrievalOutput {
  temporalWindowDays: number | null;
  urls: string[];
}

export default class RagRetrievalProvider implements ApiProvider {
  constructor() {
    setupEvalRuntime();
  }

  id(): string {
    return 'rag-retrieval';
  }

  async callApi(prompt: string): Promise<ProviderResponse> {
    const start = Date.now();
    const state = await executeRAGWorkflow(prompt);
    await flushTraces();

    if (state.error) {
      return { error: `RAG workflow failed: ${state.error}` };
    }

    const output: RetrievalOutput = {
      temporalWindowDays: state.temporalWindow,
      urls: [...new Set(state.rerankedChunks.map((c) => c.url))],
    };
    return { output: JSON.stringify(output), latencyMs: Date.now() - start };
  }
}
