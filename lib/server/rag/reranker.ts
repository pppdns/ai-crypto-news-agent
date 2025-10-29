/**
 * LLM-based re-ranking of search results
 * Uses gpt-4o-mini to score chunk relevance and return top results
 */
import OpenAI from 'openai';
import { getRerankPrompt } from './prompts';
import { Chunk } from './types';

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
 * Score a single chunk's relevance to query using LLM
 *
 * @param query - User query
 * @param chunk - Chunk to score
 * @returns Relevance score (1-10) or null on error
 */
async function scoreChunk(query: string, chunk: Chunk): Promise<number | null> {
  try {
    const openai = getOpenAIClient();
    const prompt = getRerankPrompt(query, chunk);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0, // Deterministic scoring
      max_tokens: 10,
    });

    const scoreText = response.choices[0]?.message?.content?.trim();
    if (!scoreText) {
      return null;
    }

    // Parse the score
    const score = parseFloat(scoreText);
    if (isNaN(score) || score < 1 || score > 10) {
      console.warn(`Invalid score received: ${scoreText}`);
      return null;
    }

    return score;
  } catch (error) {
    console.error('Error scoring chunk:', error);
    return null;
  }
}

/**
 * Re-rank chunks using LLM scoring
 *
 * @param query - User query
 * @param chunks - Candidate chunks from hybrid search
 * @param topK - Number of top chunks to return (default: 8)
 * @returns Top K re-ranked chunks
 */
export async function rerankChunks(query: string, chunks: Chunk[], topK: number = 8): Promise<Chunk[]> {
  if (chunks.length === 0) {
    return [];
  }

  console.log(`Re-ranking ${chunks.length} chunks...`);

  try {
    // Score all chunks in parallel
    const scoringPromises = chunks.map(async (chunk) => {
      // TODO: Should this be optimized? Are there rate limits?
      const score = await scoreChunk(query, chunk);
      return { chunk, score };
    });

    const scoredChunks = await Promise.all(scoringPromises);

    // Filter out chunks with invalid scores and sort by score
    const validChunks = scoredChunks
      .filter((item) => item.score !== null)
      .map((item) => ({
        ...item.chunk,
        score: item.score!,
      }))
      .sort((a, b) => b.score - a.score);

    // If no valid scores, fall back to original order
    if (validChunks.length === 0) {
      console.warn('No valid scores from re-ranker, using original order');
      return chunks.slice(0, topK);
    }

    // Return top K chunks
    const topChunks = validChunks.slice(0, topK);
    console.log(`Re-ranking complete. Top ${topChunks.length} chunks selected`);

    return topChunks;
  } catch (error) {
    console.error('Re-ranking error:', error);
    // Fall back to original order on error
    return chunks.slice(0, topK);
  }
}
