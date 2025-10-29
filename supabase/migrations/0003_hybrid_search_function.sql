-- Create hybrid search function combining vector similarity and FTS
-- Weighted scoring: 70% vector + 30% FTS with recency decay

CREATE OR REPLACE FUNCTION hybrid_search(
  query_embedding vector(1536),
  query_text text,
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 40,
  cutoff_date timestamptz DEFAULT (now() - interval '21 days')
)
RETURNS TABLE (
  chunk_id uuid,
  article_id uuid,
  content text,
  title text,
  source_name text,
  published_at timestamptz,
  url text,
  score float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH vector_search AS (
    -- Vector similarity search using cosine distance
    -- Lower distance = higher similarity
    SELECT
      ac.id,
      ac.article_id,
      ac.content,
      ac.title,
      ac.source_name,
      ac.published_at,
      1 - (ac.embedding <=> query_embedding) AS similarity
    FROM article_chunks ac
    WHERE ac.published_at >= cutoff_date
      AND ac.embedding IS NOT NULL
      AND (1 - (ac.embedding <=> query_embedding)) > match_threshold
  ),
  fts_search AS (
    -- Full-text search on articles table
    SELECT
      ac.id,
      ac.article_id,
      ac.content,
      ac.title,
      ac.source_name,
      ac.published_at,
      ts_rank(a.tsvector, plainto_tsquery('english', query_text)) AS fts_score
    FROM article_chunks ac
    JOIN articles a ON a.id = ac.article_id
    WHERE a.published_at >= cutoff_date
      AND a.tsvector @@ plainto_tsquery('english', query_text)
  ),
  combined AS (
    -- Combine both searches
    SELECT DISTINCT ON (vs.id)
      vs.id,
      vs.article_id,
      vs.content,
      vs.title,
      vs.source_name,
      vs.published_at,
      vs.similarity,
      COALESCE(fs.fts_score, 0) AS fts_score
    FROM vector_search vs
    LEFT JOIN fts_search fs ON vs.id = fs.id
    
    UNION
    
    SELECT DISTINCT ON (fs.id)
      fs.id,
      fs.article_id,
      fs.content,
      fs.title,
      fs.source_name,
      fs.published_at,
      COALESCE(vs.similarity, 0) AS similarity,
      fs.fts_score
    FROM fts_search fs
    LEFT JOIN vector_search vs ON fs.id = vs.id
    WHERE vs.id IS NULL -- Only include FTS results not in vector search
  ),
  normalized AS (
    -- Normalize scores to 0-1 range
    SELECT
      c.*,
      CASE 
        WHEN (SELECT MAX(similarity) FROM combined) > 0 
        THEN c.similarity / (SELECT MAX(similarity) FROM combined)
        ELSE 0 
      END AS norm_similarity,
      CASE 
        WHEN (SELECT MAX(fts_score) FROM combined) > 0 
        THEN c.fts_score / (SELECT MAX(fts_score) FROM combined)
        ELSE 0 
      END AS norm_fts
    FROM combined c
  ),
  scored AS (
    -- Calculate weighted hybrid score with recency decay
    SELECT
      n.id,
      n.article_id,
      n.content,
      n.title,
      n.source_name,
      n.published_at,
      -- Weighted score: 70% vector + 30% FTS
      (0.7 * n.norm_similarity + 0.3 * n.norm_fts) * 
      -- Gentle recency decay (10% decay per 7 days)
      (1.0 - (EXTRACT(EPOCH FROM (now() - n.published_at)) / (7 * 24 * 60 * 60)) * 0.1) AS hybrid_score
    FROM normalized n
  )
  SELECT
    s.id AS chunk_id,
    s.article_id,
    s.content,
    s.title,
    s.source_name,
    s.published_at,
    a.url,
    s.hybrid_score AS score
  FROM scored s
  JOIN articles a ON a.id = s.article_id
  ORDER BY s.hybrid_score DESC
  LIMIT match_count;
END;
$$;

-- Add comment
COMMENT ON FUNCTION hybrid_search IS 'Hybrid search combining vector similarity (70%) and FTS (30%) with recency decay';
