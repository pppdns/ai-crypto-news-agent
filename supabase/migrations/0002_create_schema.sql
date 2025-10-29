-- Create complete schema for crypto news agent
-- This migration creates all tables, indexes, constraints, and RLS policies

-- Required for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- TABLES
-- =============================================================================

-- Sources table: RSS feed sources
CREATE TABLE sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  homepage_url text NOT NULL,
  rss_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Articles table: News articles with FTS support
CREATE TABLE articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  url text NOT NULL,
  url_hash text NOT NULL UNIQUE, -- MD5 hash for fast deduplication
  title text,
  author text,
  published_at timestamptz,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  text_summary text, -- LLM-generated clean summary
  tsvector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(text_summary, '')), 'B')
  ) STORED, -- Weighted FTS: title (A) + summary (B)
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Article chunks table: Paragraph chunks with embeddings and denormalized metadata
CREATE TABLE article_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL CHECK (chunk_index >= 0),
  content text NOT NULL,
  -- Denormalized metadata for query performance
  title text,
  source_name text,
  published_at timestamptz,
  -- Vector embedding
  embedding vector(1536), -- OpenAI text-embedding-3-large with dimensions=1536
  token_count integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Unique constraint: one chunk index per article
  UNIQUE (article_id, chunk_index)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Articles table indexes
CREATE INDEX idx_articles_tsvector ON articles USING GIN(tsvector); -- Full Text Search
CREATE INDEX idx_articles_published_at ON articles(published_at); -- Recency filtering
CREATE INDEX idx_articles_source_id ON articles(source_id); -- Join optimization

-- Article chunks table indexes
-- HNSW index for vector similarity search (cosine distance)
-- We use text-embedding-3-large with dimensions=1536 (reduced from 3072) which:
--   - Retains ~95% of full model semantic quality
--   - Fits within pgvector 0.8.0's 2000-dimension HNSW limit
--   - Enables HNSW's superior accuracy (97-99% recall vs IVFFlat's 90-95%)
-- 
-- HNSW Parameters:
--   m = 16 (max connections per layer)
--     - Higher m = better recall but larger index and slower builds
--     - 16 is optimal for most use cases
--   ef_construction = 64 (build-time search depth)
--     - Higher = better index quality but slower build
--     - 64 is good balance for production
--
-- Query-time tuning (if needed):
--   SET hnsw.ef_search = 40;  -- Default, increase for higher recall
--   - ef_search=40:  ~97% recall (default, fast)
--   - ef_search=64:  ~98% recall (balanced)
--   - ef_search=128: ~99% recall (slower, near-perfect)
--
-- For most queries, default ef_search=40 provides excellent 97% recall
CREATE INDEX idx_article_chunks_embedding ON article_chunks 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_article_chunks_article_id ON article_chunks(article_id); -- Join optimization
CREATE INDEX idx_article_chunks_published_at ON article_chunks(published_at); -- Recency filtering

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables to disable public access
-- Backend uses service role key which bypasses RLS
-- No policies are created intentionally - all access via service role only

ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_chunks ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE sources IS 'RLS enabled - no public access, backend uses service role key';
COMMENT ON TABLE articles IS 'RLS enabled - no public access, backend uses service role key';
COMMENT ON TABLE article_chunks IS 'RLS enabled - no public access, backend uses service role key';

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Insert RSS feed sources
INSERT INTO sources (id, name, homepage_url, rss_url) VALUES
  (
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Cointelegraph',
    'https://cointelegraph.com',
    'https://cointelegraph.com/rss'
  ),
  (
    'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
    'CryptoPotato',
    'https://cryptopotato.com',
    'https://cryptopotato.com/feed'
  ),
  (
    'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f',
    'NewsBTC',
    'https://www.newsbtc.com',
    'https://www.newsbtc.com/feed'
  );

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN articles.url_hash IS 'MD5 hash of normalized URL for fast deduplication checks';
COMMENT ON COLUMN articles.text_summary IS 'LLM-generated clean text summary - source for chunks';
COMMENT ON COLUMN articles.tsvector IS 'Full-text search vector with weighted title (A) and summary (B)';

COMMENT ON COLUMN article_chunks.content IS 'Plain text content of article paragraph chunk';
COMMENT ON COLUMN article_chunks.title IS 'Denormalized from articles.title for query performance';
COMMENT ON COLUMN article_chunks.source_name IS 'Denormalized from sources.name for query performance';
COMMENT ON COLUMN article_chunks.published_at IS 'Denormalized from articles.published_at for recency filtering';
COMMENT ON COLUMN article_chunks.embedding IS 'L2-normalized 1536-dim vector from OpenAI text-embedding-3-large (dimensions=1536)';
COMMENT ON COLUMN article_chunks.token_count IS 'Token count for chunk - used for context budgeting';

-- =============================================================================
-- EMBEDDING MODEL CONFIGURATION
-- =============================================================================
-- 
-- This schema uses OpenAI text-embedding-3-large with dimensions=1536:
--
--   const embedding = await openai.embeddings.create({
--     model: "text-embedding-3-large",
--     input: text,
--     dimensions: 1536  // Request reduced dimensions
--   });
--
-- Why 1536 instead of full 3072 dimensions?
--   1. Fits within pgvector 0.8.0's 2000-dimension HNSW limit
--   2. Enables HNSW index (97-99% recall, superior to IVFFlat)
--   3. Retains ~95% of full model's semantic quality
--   4. text-embedding-3-large @ 1536d outperforms text-embedding-3-small @ 1536d
--   5. Same cost as full 3072-dim model
--
-- HNSW Query Tuning (optional):
--   The default ef_search=40 provides 97% recall, which is excellent.
--   If you need higher recall, tune at query time:
--
--   SET hnsw.ef_search = 64;   -- 98% recall
--   SET hnsw.ef_search = 128;  -- 99% recall (slower)
--
-- For most use cases, the default HNSW settings are optimal.
