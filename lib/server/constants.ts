/**
 * Shared constants for the crypto news agent
 */

/**
 * Maximum age in days for articles to be scraped from RSS feeds
 * Articles older than this will be filtered out during ingestion
 */
export const CRAWLING_MAX_ARTICLE_AGE_DAYS = 30;

/**
 * OpenAI embedding model used for generating article chunk embeddings
 */
export const EMBEDDING_MODEL = 'text-embedding-3-large';

/**
 * Embedding dimensions for the model
 * Reduced from 3072 to 1536 for pgvector 0.8.0 HNSW compatibility
 * while retaining ~95% of full model quality
 */
export const EMBEDDING_DIMENSIONS = 1536;
