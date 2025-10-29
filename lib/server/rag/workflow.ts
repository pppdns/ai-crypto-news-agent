/**
 * Sequential RAG pipeline workflow
 * Orchestrates: temporal detection → embedding → hybrid search → rerank → answer → citations
 */
import OpenAI from 'openai';
import { generateEmbedding } from '../embeddings';
import { parseCitations } from './citations';
import { hybridSearch } from './hybrid-search';
import { getAnswerPrompt } from './prompts';
import { rerankChunks } from './reranker';
import { detectTemporalWindow } from './temporal-detection';
import { RAGState } from './types';

// OpenAI client singleton
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Missing OPENAI_API_KEY environment variable');
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
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
  } catch (error) {
    console.error('Error in detectTemporalNode:', error);
    return {
      error: 'Failed to detect temporal window',
      temporalWindow: 21, // Default fallback
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
  } catch (error) {
    console.error('Error in generateEmbeddingNode:', error);
    return {
      error: 'Failed to generate query embedding',
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
      limit: 40,
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
  } catch (error) {
    console.error('Error in hybridSearchNode:', error);
    return {
      error: 'Failed to execute hybrid search',
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
    const rerankedChunks = await rerankChunks(state.query, state.candidates, 8);
    console.log(`Re-ranking complete: ${rerankedChunks.length} top chunks`);

    return {
      rerankedChunks,
    };
  } catch (error) {
    console.error('Error in rerankNode:', error);
    // Fall back to top candidates without re-ranking
    return {
      rerankedChunks: state.candidates.slice(0, 8),
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
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const answer = response.choices[0]?.message?.content || 'No recent news';
    console.log('Answer generated');

    return {
      answer,
    };
  } catch (error) {
    console.error('Error in generateAnswerNode:', error);
    return {
      error: 'Failed to generate answer',
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
  } catch (error) {
    console.error('Error in enrichCitationsNode:', error);
    return {
      citations: [],
    };
  }
}

/**
 * Execute RAG pipeline sequentially through all nodes
 * This replaces LangGraph orchestration with a simple sequential execution
 */
async function executeWorkflowSteps(initialState: RAGState): Promise<RAGState> {
  let state = { ...initialState };

  // Step 1: Detect temporal window
  const temporalResult = await detectTemporalNode(state);
  state = { ...state, ...temporalResult };
  if (state.error) return state;

  // Step 2: Generate query embedding
  const embeddingResult = await generateEmbeddingNode(state);
  state = { ...state, ...embeddingResult };
  if (state.error) return state;

  // Step 3: Execute hybrid search
  const searchResult = await hybridSearchNode(state);
  state = { ...state, ...searchResult };
  if (state.error) return state;

  // Step 4: Re-rank candidates
  const rerankResult = await rerankNode(state);
  state = { ...state, ...rerankResult };
  if (state.error) return state;

  // Step 5: Generate answer
  const answerResult = await generateAnswerNode(state);
  state = { ...state, ...answerResult };
  if (state.error) return state;

  // Step 6: Enrich citations
  const citationsResult = await enrichCitationsNode(state);
  state = { ...state, ...citationsResult };

  return state;
}

/**
 * Execute RAG workflow for a query
 *
 * @param query - User's question
 * @returns Final state with answer and citations
 */
export async function executeRAGWorkflow(query: string): Promise<RAGState> {
  const initialState: RAGState = {
    query,
    temporalWindow: null,
    queryEmbedding: null,
    candidates: [],
    rerankedChunks: [],
    answer: '',
    citations: [],
    error: null,
  };

  try {
    console.log(`\n=== Starting RAG workflow for query: "${query}" ===\n`);
    const result = await executeWorkflowSteps(initialState);
    console.log('\n=== RAG workflow completed ===\n');

    return result;
  } catch (error) {
    console.error('RAG workflow execution error:', error);
    return {
      ...initialState,
      error: error instanceof Error ? error.message : 'Unknown error',
      answer: 'An error occurred while processing your request.',
    };
  }
}
