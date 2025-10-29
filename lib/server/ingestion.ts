/**
 * Database ingestion utilities for articles and chunks
 */
import type { TablesInsert } from '@/supabase/database.types';
import { getServerClient } from './supabase';
import { hashUrl } from './url-utils';

/**
 * Insert a single article into the database
 * Uses ON CONFLICT DO NOTHING for idempotent behavior
 * Returns the article ID and a boolean indicating if it was newly created
 */
export async function insertArticle(article: {
  sourceId: string;
  url: string;
  title: string;
  author?: string;
  publishedAt: string;
  textSummary: string;
}): Promise<{ id: string; isNew: boolean }> {
  const supabase = getServerClient();
  const urlHash = hashUrl(article.url);

  // First, check if article already exists
  const { data: existing, error: checkError } = await supabase
    .from('articles')
    .select('id')
    .eq('url_hash', urlHash)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    // PGRST116 is "not found", which is expected
    throw new Error(`Failed to check for existing article: ${checkError.message}`);
  }

  if (existing) {
    // Article already exists, return its ID with isNew = false
    return { id: existing.id, isNew: false };
  }

  // Insert new article
  const articleData: TablesInsert<'articles'> = {
    source_id: article.sourceId,
    url: article.url,
    url_hash: urlHash,
    title: article.title,
    author: article.author,
    published_at: article.publishedAt,
    text_summary: article.textSummary,
    fetched_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('articles').insert(articleData).select('id').single();

  if (error) {
    // Check if it's a duplicate key error (race condition)
    if (error.code === '23505') {
      // Duplicate key, fetch the existing article
      const { data: existingData, error: fetchError } = await supabase
        .from('articles')
        .select('id')
        .eq('url_hash', urlHash)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch existing article after duplicate key error: ${fetchError.message}`);
      }

      return { id: existingData.id, isNew: false };
    }

    throw new Error(`Failed to insert article: ${error.message}`);
  }

  return { id: data.id, isNew: true };
}

/**
 * Insert multiple chunks for an article
 * Includes denormalized metadata for query performance
 */
export async function insertChunks(
  articleId: string,
  chunks: Array<{
    chunkIndex: number;
    content: string;
    tokenCount: number;
    embedding: number[];
    // Denormalized metadata
    title: string;
    sourceName: string;
    publishedAt: string;
  }>,
): Promise<void> {
  if (chunks.length === 0) {
    return;
  }

  const supabase = getServerClient();

  // Convert embeddings to the format expected by pgvector (stringified array)
  const chunkData: TablesInsert<'article_chunks'>[] = chunks.map((chunk) => ({
    article_id: articleId,
    chunk_index: chunk.chunkIndex,
    content: chunk.content,
    token_count: chunk.tokenCount,
    embedding: JSON.stringify(chunk.embedding),
    // Denormalized metadata
    title: chunk.title,
    source_name: chunk.sourceName,
    published_at: chunk.publishedAt,
  }));

  const { error } = await supabase.from('article_chunks').insert(chunkData);

  if (error) {
    throw new Error(`Failed to insert chunks: ${error.message}`);
  }
}

/**
 * Get source ID by name
 */
export async function getSourceIdByName(sourceName: string): Promise<string | null> {
  const supabase = getServerClient();

  const { data, error } = await supabase.from('sources').select('id').eq('name', sourceName).single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(`Failed to get source ID: ${error.message}`);
  }

  return data.id;
}

/**
 * Get all sources
 */
export async function getSources(): Promise<Array<{ id: string; name: string }>> {
  const supabase = getServerClient();

  const { data, error } = await supabase.from('sources').select('id, name');

  if (error) {
    throw new Error(`Failed to get sources: ${error.message}`);
  }

  return data || [];
}
