/**
 * System prompts for RAG pipeline
 */
import { Chunk } from './types';

/**
 * Generate answer generation prompt with context chunks
 *
 * @param query - User's question
 * @param chunks - Retrieved and reranked chunks
 * @returns Formatted prompt for LLM
 */
export function getAnswerPrompt(query: string, chunks: Chunk[]): string {
  // Format context chunks with article IDs for citation
  const contextText = chunks
    .map(
      (chunk, idx) =>
        `[${idx + 1}] Article ID: ${chunk.article_id}
Title: ${chunk.title || 'Untitled'}
Source: ${chunk.source_name || 'Unknown'}
Date: ${chunk.published_at ? new Date(chunk.published_at).toLocaleDateString() : 'Unknown'}

${chunk.content}`,
    )
    .join('\n\n---\n\n');

  return `You are a helpful crypto news assistant. Answer the user's question using ONLY the provided context below.

STRICT RULES:
1. Only use information from the context provided
2. Cite every claim using exactly this format: [Article ID: <uuid>] immediately after the relevant sentence. Make sure the article ID is using the UUID format.
3. Use the exact Article ID from the context (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
4. If the context doesn't contain enough information to answer the question, respond EXACTLY with: "No recent news"
5. Do not fabricate or hallucinate any information
6. If the request is offensive or inappropriate, politely decline
7. Be concise and factual in your response

Context:
${contextText}

User Question: ${query}

Answer:`;
}

/**
 * Generate re-ranking prompt for scoring chunk relevance
 *
 * @param query - User's question
 * @param chunk - Chunk to score
 * @returns Prompt for relevance scoring
 */
export function getRerankPrompt(query: string, chunk: Chunk): string {
  return `Score the relevance of this article chunk to the user's query on a scale of 1-10, where:
- 1-3: Not relevant or off-topic
- 4-6: Somewhat relevant, mentions related concepts
- 7-8: Relevant, contains useful information
- 9-10: Highly relevant, directly answers the query

Query: ${query}

Article Chunk:
Title: ${chunk.title || 'Untitled'}
Content: ${chunk.content}

Respond with ONLY a single number between 1 and 10. No explanation needed.

Score:`;
}
