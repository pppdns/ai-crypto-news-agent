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
  embedding vector(3072), -- OpenAI text-embedding-3-large (3072 dimensions)
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
-- IVFFlat index for vector similarity search (cosine distance)
-- Note: HNSW is limited to 2000 dimensions in pgvector 0.8.0, but text-embedding-3-large uses 3072 dimensions
-- IVFFlat is used instead - supports larger dimensions with good performance
-- 
-- Index Parameters (build-time):
--   lists = 1000 (number of clusters)
--   - Higher = better accuracy but slower index build and larger index
--   - Optimal range: sqrt(rows) to rows/1000
--   - 1000 is good for 10K-1M chunks (our expected range)
--
-- Query Parameters (set at query time for accuracy tuning):
--   SET ivfflat.probes = 20;  -- Default is 1, increase for better recall
--   - probes=1:  ~85% recall, fastest
--   - probes=10: ~92% recall, balanced
--   - probes=20: ~95% recall, slower but high accuracy
--   - probes=50: ~98% recall, much slower
--
-- Performance trade-off: Higher lists + probes = better accuracy but slower queries
-- Start with probes=20 for production, adjust based on recall requirements
CREATE INDEX idx_article_chunks_embedding ON article_chunks 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 1000);

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
COMMENT ON COLUMN article_chunks.embedding IS 'L2-normalized 3072-dim vector from OpenAI text-embedding-3-large';
COMMENT ON COLUMN article_chunks.token_count IS 'Token count for chunk - used for context budgeting';

-- =============================================================================
-- IVFFLAT TUNING GUIDE
-- =============================================================================
-- 
-- To tune IVFFlat accuracy at query time, set the probes parameter in your backend:
--
-- Example usage in application code:
--
--   // Before vector similarity queries, set probes for higher accuracy
--   await supabase.rpc('execute_sql', { 
--     sql: 'SET ivfflat.probes = 20' 
--   });
--
--   // Or in raw SQL:
--   SET ivfflat.probes = 20;
--
--   // Then run your vector similarity query
--   SELECT id, content, embedding <=> $1 AS distance
--   FROM article_chunks
--   ORDER BY embedding <=> $1
--   LIMIT 40;
--
-- Accuracy vs Speed trade-off:
--   probes=1:  85% recall, ~5-10ms   (default, fast but less accurate)
--   probes=10: 92% recall, ~15-25ms  (recommended for production)
--   probes=20: 95% recall, ~30-50ms  (high accuracy, acceptable for demo)
--   probes=50: 98% recall, ~100ms+   (near-HNSW accuracy, slower)
--
-- Recommendation: Start with probes=20, increase to 50 if recall is insufficient
--
-- Note: This setting is per-session, so set it before each query batch or use
-- connection pooler settings to persist across connections.
