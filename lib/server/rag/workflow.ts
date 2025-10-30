/**
 * LangGraph-based RAG pipeline workflow
 * Orchestrates: temporal detection → embedding → hybrid search → rerank → answer → citations
 * Uses conditional routing to optimize execution flow
 */
import type { CompiledStateGraph } from '@langchain/langgraph';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import OpenAI from 'openai';
import { generateEmbedding } from '../embeddings';
import { parseCitations } from './citations';
import { hybridSearch } from './hybrid-search';
import { getAnswerPrompt } from './prompts';
import { rerankChunks } from './reranker';
import { detectTemporalWindow } from './temporal-detection';
import type { RAGState } from './types';

// Constants
const LLM_MODEL = 'gpt-4o-mini' as const;
const LLM_TEMPERATURE = 0.3;
const LLM_MAX_TOKENS = 1000;
const RERANK_THRESHOLD = 10;
const MAX_CHUNKS = 8;
const CANDIDATE_LIMIT = 40;
const DEFAULT_TEMPORAL_WINDOW_DAYS = 21;

// Type for valid route destinations
type RouteDestination = typeof END | 'skipRerank' | 'rerank';

// OpenAI client singleton
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY environment variable');
    }
    openaiClient = new OpenAI({
      apiKey,
    });
  }
  return openaiClient;
}

/**
 * Node: Detect temporal keywords in query
 */
async function detectTemporalNode(state: RAGState): Promise<Partial<RAGState>> {
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
async function generateEmbeddingNode(state: RAGState): Promise<Partial<RAGState>> {
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
async function hybridSearchNode(state: RAGState): Promise<Partial<RAGState>> {
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
        answer: 'No recent news',
        citations: [],
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
async function rerankNode(state: RAGState): Promise<Partial<RAGState>> {
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
 * Node: Generate answer with LLM (streaming)
 */
async function generateAnswerNode(state: RAGState): Promise<Partial<RAGState>> {
  if (state.rerankedChunks.length === 0) {
    return {
      answer: 'No recent news',
      citations: [],
    };
  }

  try {
    console.log('Generating answer...');
    const openai = getOpenAIClient();
    const prompt = getAnswerPrompt(state.query, state.rerankedChunks);

    // Non-streaming completion for the workflow
    // (Streaming will be handled in the route handler)
    const response = await openai.chat.completions.create({
      model: LLM_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: LLM_TEMPERATURE,
      max_tokens: LLM_MAX_TOKENS,
    });

    const answer = response.choices[0]?.message?.content || 'No recent news';
    console.log('Answer generated');

    return {
      answer,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate answer';
    console.error('Error in generateAnswerNode:', error);
    return {
      error: errorMessage,
    };
  }
}

/**
 * Node: Enrich citations from answer
 */
async function enrichCitationsNode(state: RAGState): Promise<Partial<RAGState>> {
  if (!state.answer || state.answer === 'No recent news') {
    return { citations: [] };
  }

  try {
    console.log('Parsing and enriching citations...');
    const { citations } = await parseCitations(state.answer);
    console.log(`Found ${citations.length} citations`);

    return {
      citations,
    };
  } catch (error: unknown) {
    console.error('Error in enrichCitationsNode:', error);
    return {
      citations: [],
    };
  }
}

/**
 * Node: Skip re-ranking when too few candidates
 * Uses all available candidates directly without LLM scoring
 * Since we have < RERANK_THRESHOLD candidates, we use them all rather than discarding any
 */
async function skipRerankNode(state: RAGState): Promise<Partial<RAGState>> {
  console.log('Skipping re-ranking (too few candidates)...');
  // Use all candidates since we already have so few (< RERANK_THRESHOLD)
  // They're already sorted by hybrid search score
  console.log(`Using all ${state.candidates.length} candidates directly`);

  return {
    rerankedChunks: state.candidates,
  };
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
  answer: Annotation<string>,
  citations: Annotation<RAGState['citations']>,
  error: Annotation<string | null>,
});

/**
 * Build and compile the LangGraph workflow
 * Creates a StateGraph with conditional routing for optimized execution
 */
function buildRAGGraph(): CompiledStateGraph<
  typeof GraphAnnotation.State,
  unknown,
  | '__start__'
  | 'detectTemporal'
  | 'generateEmbedding'
  | 'hybridSearch'
  | 'skipRerank'
  | 'rerank'
  | 'generateAnswer'
  | 'enrichCitations'
> {
  const workflow = new StateGraph(GraphAnnotation)
    // Add all nodes
    .addNode('detectTemporal', detectTemporalNode)
    .addNode('generateEmbedding', generateEmbeddingNode)
    .addNode('hybridSearch', hybridSearchNode)
    .addNode('skipRerank', skipRerankNode)
    .addNode('rerank', rerankNode)
    .addNode('generateAnswer', generateAnswerNode)
    .addNode('enrichCitations', enrichCitationsNode)
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
    // Both paths converge at generateAnswer
    .addEdge('skipRerank', 'generateAnswer')
    .addEdge('rerank', 'generateAnswer')
    .addEdge('generateAnswer', 'enrichCitations')
    .addEdge('enrichCitations', END);

  return workflow.compile();
}

/**
 * Execute RAG workflow for a query
 * Uses LangGraph StateGraph for orchestration with conditional routing
 *
 * @param query - User's question
 * @returns Final state with answer and citations
 */
export async function executeRAGWorkflow(query: string): Promise<RAGState> {
  const initialState = {
    query,
    temporalWindow: null as number | null,
    queryEmbedding: null as number[] | null,
    candidates: [] as RAGState['candidates'],
    rerankedChunks: [] as RAGState['rerankedChunks'],
    answer: '',
    citations: [] as RAGState['citations'],
    error: null as string | null,
  };

  try {
    console.log(`\n=== Starting RAG workflow for query: "${query}" ===\n`);

    // Build and compile the graph
    const graph = buildRAGGraph();

    // Execute the graph
    const result = await graph.invoke(initialState);

    console.log('\n=== RAG workflow completed ===\n');

    // The result from LangGraph has the same shape as RAGState
    // Type assertion is safe here as we control the graph structure
    return result as unknown as RAGState;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('RAG workflow execution error:', error);
    return {
      ...initialState,
      error: errorMessage,
      answer: 'An error occurred while processing your request.',
    };
  }
}
