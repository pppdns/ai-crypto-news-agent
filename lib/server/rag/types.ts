/**
 * Shared TypeScript interfaces for the RAG pipeline
 */

/**
 * Article chunk with metadata from database
 */
export interface Chunk {
  id: string;
  article_id: string;
  content: string;
  title: string | null;
  source_name: string | null;
  published_at: string | null;
  url: string;
  score?: number; // Hybrid or re-ranking score
}

/**
 * Citation for display in UI
 */
export interface Citation {
  url: string;
  title: string;
  sourceName: string;
  relativeDate: string;
  articleId: string;
}

/**
 * State for LangGraph RAG workflow
 */
export interface RAGState {
  query: string;
  temporalWindow: number | null; // Days for recency filtering
  queryEmbedding: number[] | null;
  candidates: Chunk[];
  rerankedChunks: Chunk[];
  answer: string;
  citations: Citation[];
  error: string | null;
}

/**
 * Temporal detection result
 */
export interface TemporalWindow {
  days: number;
  detected: boolean;
  keyword?: string;
}
