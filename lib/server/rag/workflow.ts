/**
 * LangGraph-based RAG pipeline workflow
 * Orchestrates: temporal detection → embedding → hybrid search → rerank
 * Uses conditional routing to optimize execution flow
 * Answer generation and citation enrichment happen in the route handler
 *
 * Each node is wrapped in a Langfuse observation (span / embedding / retriever), so the
 * workflow shows up as a nested trace under the `/ask` request (see docs/tracing.md).
 */
import type { CompiledStateGraph } from '@langchain/langgraph';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { startActiveObservation } from '@langfuse/tracing';
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from '../constants';
import { generateEmbedding } from '../embeddings';
import { hybridSearch } from './hybrid-search';
import { rerankChunks } from './reranker';
import { detectTemporalWindow } from './temporal-detection';
import type { RAGState } from './types';

// Constants
const RERANK_THRESHOLD = 50; // Disable re-ranking for now
// const RERANK_THRESHOLD = 10;
const MAX_CHUNKS = 8;
const CANDIDATE_LIMIT = 40;
const DEFAULT_TEMPORAL_WINDOW_DAYS = 21;

// Type for valid route destinations
type RouteDestination = typeof END | 'skipRerank' | 'rerank';

/**
 * Node: Detect temporal keywords in query
 */
async function detectTemporal(state: RAGState): Promise<Partial<RAGState>> {
  try {
    console.log('Detecting temporal window...');
    const temporal = detectTemporalWindow(state.query);
    console.log(
      `Temporal window: ${temporal.days} days${temporal.detected ? ` (keyword: ${temporal.keyword})` : ' (default)'}`,
    );

    return {
      temporalWindow: temporal.days,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to detect temporal window';
    console.error('Error in detectTemporalNode:', error);
    return {
      error: errorMessage,
      temporalWindow: DEFAULT_TEMPORAL_WINDOW_DAYS,
    };
  }
}

/**
 * Node: Generate query embedding
 */
async function generateQueryEmbedding(state: RAGState): Promise<Partial<RAGState>> {
  try {
    console.log('Generating query embedding...');
    const embedding = await generateEmbedding(state.query);
    console.log(`Embedding generated (${embedding.length} dimensions)`);

    return {
      queryEmbedding: embedding,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate query embedding';
    console.error('Error in generateEmbeddingNode:', error);
    return {
      error: errorMessage,
    };
  }
}

/**
 * Node: Execute hybrid search
 */
async function searchCandidates(state: RAGState): Promise<Partial<RAGState>> {
  if (!state.queryEmbedding) {
    return { error: 'Query embedding not available' };
  }

  if (state.temporalWindow === null) {
    return { error: 'Temporal window not set' };
  }

  try {
    console.log('Executing hybrid search...');
    const candidates = await hybridSearch({
      queryEmbedding: state.queryEmbedding,
      query: state.query,
      temporalWindowDays: state.temporalWindow,
      limit: CANDIDATE_LIMIT,
    });

    if (candidates.length === 0) {
      console.log('No candidates found');
      return {
        candidates: [],
      };
    }

    console.log(`Found ${candidates.length} candidate chunks`);
    return {
      candidates,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to execute hybrid search';
    console.error('Error in hybridSearchNode:', error);
    return {
      error: errorMessage,
    };
  }
}

/**
 * Node: Re-rank candidates using LLM
 */
async function rerankCandidates(state: RAGState): Promise<Partial<RAGState>> {
  if (state.candidates.length === 0) {
    return { rerankedChunks: [] };
  }

  try {
    console.log('Re-ranking candidates...');
    const rerankedChunks = await rerankChunks(state.query, state.candidates, MAX_CHUNKS);
    console.log(`Re-ranking complete: ${rerankedChunks.length} top chunks`);

    return {
      rerankedChunks,
    };
  } catch (error: unknown) {
    console.error('Error in rerankNode:', error);
    // Fall back to top candidates without re-ranking
    return {
      rerankedChunks: state.candidates.slice(0, MAX_CHUNKS),
    };
  }
}

/**
 * Node: Skip re-ranking when too few candidates
 * Uses all available candidates directly without LLM scoring
 * Since we have < RERANK_THRESHOLD candidates, we use them all rather than discarding any
 */
async function useCandidatesDirectly(state: RAGState): Promise<Partial<RAGState>> {
  console.log('Skipping re-ranking (too few candidates)...');
  // Use all candidates since we already have so few (< RERANK_THRESHOLD)
  // They're already sorted by hybrid search score
  console.log(`Using all ${state.candidates.length} candidates directly`);

  return {
    rerankedChunks: state.candidates,
  };
}

/** Compact chunk summary for trace payloads (full chunk text would bloat the trace). */
function summarizeChunks(chunks: RAGState['candidates']) {
  return chunks.map((c) => ({ articleId: c.article_id, title: c.title, source: c.source_name, score: c.score }));
}

// Traced LangGraph nodes. Each records curated input/output on its Langfuse observation.

function detectTemporalNode(state: RAGState): Promise<Partial<RAGState>> {
  return startActiveObservation('detect-temporal-window', async (span) => {
    const result = await detectTemporal(state);
    span.update({ input: { query: state.query }, output: { days: result.temporalWindow } });
    return result;
  });
}

function generateEmbeddingNode(state: RAGState): Promise<Partial<RAGState>> {
  return startActiveObservation(
    'embed-query',
    async (embedding) => {
      const result = await generateQueryEmbedding(state);
      embedding.update({
        model: EMBEDDING_MODEL,
        input: state.query,
        output: { dimensions: result.queryEmbedding?.length ?? 0 },
        level: result.error ? 'ERROR' : 'DEFAULT',
        statusMessage: result.error ?? undefined,
      });
      return result;
    },
    { asType: 'embedding' },
  );
}

function hybridSearchNode(state: RAGState): Promise<Partial<RAGState>> {
  return startActiveObservation(
    'hybrid-search',
    async (retriever) => {
      const result = await searchCandidates(state);
      retriever.update({
        input: { query: state.query, temporalWindowDays: state.temporalWindow, limit: CANDIDATE_LIMIT },
        output: summarizeChunks(result.candidates ?? []),
        metadata: { embeddingDimensions: EMBEDDING_DIMENSIONS, candidateCount: result.candidates?.length ?? 0 },
        level: result.error ? 'ERROR' : 'DEFAULT',
        statusMessage: result.error ?? undefined,
      });
      return result;
    },
    { asType: 'retriever' },
  );
}

function rerankNode(state: RAGState): Promise<Partial<RAGState>> {
  return startActiveObservation('rerank', async (span) => {
    const result = await rerankCandidates(state);
    span.update({
      input: { candidates: state.candidates.length, topK: MAX_CHUNKS },
      output: summarizeChunks(result.rerankedChunks ?? []),
    });
    return result;
  });
}

function skipRerankNode(state: RAGState): Promise<Partial<RAGState>> {
  return startActiveObservation('skip-rerank', async (span) => {
    const result = await useCandidatesDirectly(state);
    span.update({
      input: { candidates: state.candidates.length, rerankThreshold: RERANK_THRESHOLD },
      output: summarizeChunks(result.rerankedChunks ?? []),
    });
    return result;
  });
}

/**
 * Routing function: Decide whether to skip re-ranking
 * Routes based on candidate count and error state
 */
function routeAfterSearch(state: RAGState): RouteDestination {
  // If error occurred or no candidates found, end early
  if (state.error || state.candidates.length === 0) {
    console.log('Routing to END (error or no candidates)');
    return END;
  }

  // Skip re-ranking if fewer than threshold
  if (state.candidates.length < RERANK_THRESHOLD) {
    console.log(`Routing to skipRerank (only ${state.candidates.length} candidates)`);
    return 'skipRerank';
  }

  // Otherwise, proceed with full re-ranking
  console.log(`Routing to rerank (${state.candidates.length} candidates)`);
  return 'rerank';
}

/**
 * Define the state schema using LangGraph Annotation API
 */
const GraphAnnotation = Annotation.Root({
  query: Annotation<string>,
  temporalWindow: Annotation<number | null>,
  queryEmbedding: Annotation<number[] | null>,
  candidates: Annotation<RAGState['candidates']>,
  rerankedChunks: Annotation<RAGState['rerankedChunks']>,
  error: Annotation<string | null>,
});

/**
 * Build and compile the LangGraph workflow
 * Creates a StateGraph with conditional routing for optimized execution
 */
function buildRAGGraph(): CompiledStateGraph<
  typeof GraphAnnotation.State,
  unknown,
  '__start__' | 'detectTemporal' | 'generateEmbedding' | 'hybridSearch' | 'skipRerank' | 'rerank'
> {
  const workflow = new StateGraph(GraphAnnotation)
    // Add all nodes
    .addNode('detectTemporal', detectTemporalNode)
    .addNode('generateEmbedding', generateEmbeddingNode)
    .addNode('hybridSearch', hybridSearchNode)
    .addNode('skipRerank', skipRerankNode)
    .addNode('rerank', rerankNode)
    // Define the flow
    .addEdge(START, 'detectTemporal')
    .addEdge('detectTemporal', 'generateEmbedding')
    .addEdge('generateEmbedding', 'hybridSearch')
    // Conditional routing after search
    .addConditionalEdges('hybridSearch', routeAfterSearch, {
      [END]: END,
      skipRerank: 'skipRerank',
      rerank: 'rerank',
    })
    // Both paths end after reranking (returns rerankedChunks to route handler)
    .addEdge('skipRerank', END)
    .addEdge('rerank', END);

  return workflow.compile();
}

/**
 * Execute RAG workflow for a query
 * Uses LangGraph StateGraph for orchestration with conditional routing
 *
 * @param query - User's question
 * @returns Final state with reranked chunks for answer generation
 */
export async function executeRAGWorkflow(query: string): Promise<RAGState> {
  const initialState = {
    query,
    temporalWindow: null as number | null,
    queryEmbedding: null as number[] | null,
    candidates: [] as RAGState['candidates'],
    rerankedChunks: [] as RAGState['rerankedChunks'],
    error: null as string | null,
  };

  try {
    console.log(`\n=== Starting RAG workflow for query: "${query}" ===\n`);

    // Build and compile the graph
    const graph = buildRAGGraph();

    // Execute the graph inside a chain observation so all node spans nest under it
    const result = await startActiveObservation(
      'rag-workflow',
      async (chain) => {
        const state = (await graph.invoke(initialState)) as unknown as RAGState;
        chain.update({
          input: { query },
          output: { temporalWindowDays: state.temporalWindow, contextChunks: state.rerankedChunks.length },
          level: state.error ? 'ERROR' : 'DEFAULT',
          statusMessage: state.error ?? undefined,
        });
        return state;
      },
      { asType: 'chain' },
    );

    console.log('\n=== RAG workflow completed ===\n');

    // The result from LangGraph has the same shape as RAGState (asserted above; we control the graph structure)
    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('RAG workflow execution error:', error);
    return {
      ...initialState,
      error: errorMessage,
    };
  }
}
