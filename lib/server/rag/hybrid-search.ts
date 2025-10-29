/**
 * Hybrid search combining vector similarity and Full Text Search (FTS)
 * Retrieves top candidates using weighted scoring with recency filtering
 */
import { getSupabaseClient } from '@/lib/server/supabase';
import { Chunk } from './types';

/**
 * Hybrid search parameters
 */
interface HybridSearchParams {
  queryEmbedding: number[];
  query: string;
  temporalWindowDays: number;
  limit?: number;
}

/**
 * Hybrid search response row from Postgres RPC function
 */
interface HybridSearchRow {
  chunk_id: string;
  article_id: string;
  content: string;
  title: string | null;
  source_name: string | null;
  published_at: string | null;
  url: string;
  score: number;
}

/**
 * Execute hybrid search combining vector similarity and FTS
 *
 * Weighted scoring:
 * - 70% vector similarity (cosine distance)
 * - 30% FTS rank
 * - Gentle recency decay for older content
 *
 * @param params - Search parameters
 * @returns Top candidate chunks with metadata
 */
export async function hybridSearch(params: HybridSearchParams): Promise<Chunk[]> {
  const { queryEmbedding, query, temporalWindowDays, limit = 40 } = params;

  const supabase = getSupabaseClient();

  // Calculate cutoff date for recency filtering
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - temporalWindowDays);
  const cutoffIso = cutoffDate.toISOString();

  try {
    // Execute hybrid search query using Postgres function
    // Convert embedding array to JSON string for vector parameter
    const { data, error } = (await supabase.rpc('hybrid_search', {
      query_embedding: JSON.stringify(queryEmbedding),
      query_text: query,
      match_threshold: 0.3, // Minimum similarity threshold
      match_count: limit,
      cutoff_date: cutoffIso,
    })) as { data: HybridSearchRow[] | null; error: Error | null };

    if (error) {
      console.error('Hybrid search error:', error);
      throw new Error(`Hybrid search failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log('No results found for hybrid search');
      return [];
    }

    // Map results to Chunk interface
    const chunks: Chunk[] = data.map((row) => ({
      id: row.chunk_id,
      article_id: row.article_id,
      content: row.content,
      title: row.title,
      source_name: row.source_name,
      published_at: row.published_at,
      url: row.url,
      score: row.score,
    }));

    console.log(`Hybrid search retrieved ${chunks.length} candidates`);
    return chunks;
  } catch (error) {
    console.error('Hybrid search execution error:', error);
    throw error;
  }
}
