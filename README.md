## AI Chat Agent for Crypto News

A Next.js application that answers crypto questions using fresh, grounded news. It ingests articles from major crypto publishers, indexes them with vectors and full‑text search, retrieves and re‑ranks the most relevant passages, and generates concise answers with strict citations.

## How it works

1. Ingestion
   - Fetches RSS items from Cointelegraph, CryptoPotato, NewsBTC, 99Bitcoins, Crypto Briefing, and ZyCrypto.
   - Filters articles by date (newer than `last_scraped_at` per source, max 30 days old).
   - Scrapes article URLs with Firecrawl to extract clean plain‑text summaries.
   - Deduplicates by normalized URL hash before processing.
   - Persists article metadata and summary to Supabase Postgres.
   - Updates `last_scraped_at` timestamp for incremental ingestion on subsequent runs.

2. Chunking
   - Splits the article summary into paragraph‑sized chunks targeting 250–500 tokens with ~10–20% overlap.

3. Embeddings
   - Uses OpenAI `text-embedding-3-large` with dimensions=1536 (retains 95% of full model quality while fitting pgvector limits)

4. Storage & Indexing
   - Tables
     - `sources(id, name, homepage_url, rss_url, last_scraped_at)`
     - `articles(id, source_id, url, url_hash, title, author, published_at, fetched_at, text_summary, tsvector)`
     - `article_chunks(id, article_id, chunk_index, content, title, source_name, published_at, embedding, token_count)`
   - Indexes
     - pgvector HNSW (cosine) on `article_chunks.embedding` for fast semantic search with 97-99% recall. Built with `m=16, ef_construction=64`. Uses text-embedding-3-large @ 1536d to fit within pgvector 0.8.0's 2000-dimension HNSW limit.
     - GIN index on `articles.tsvector` for keyword/FTS (Full Text Search)
     - Recency index on `articles.published_at`

5. Retrieval (Hybrid SQL)
   - Creates a query embedding, searches top candidates using a normalized blend:
     - 0.70 vector similarity + 0.30 FTS rank
     - Applies gentle recency decay; defaults to a 14–30 day window, shrinks to ~48–72 hours when the query implies “latest/today/this week”.
   - Returns top 40 chunk candidates.

6. Re‑ranking (Conditional)
   - **If < 10 candidates**: Skips expensive LLM re-ranking, uses all candidates directly (already sorted by hybrid search).
   - **If ≥ 10 candidates**: Uses LLM scoring pass (`gpt-4o-mini`) over query + chunk text, selects top 8 chunks.
   - LangGraph orchestrates this decision with conditional routing for optimal performance.

7. Answer generation
   - Generates a concise response using only the provided context.
   - Every claim is cited with the `articles` table ID and date (the backend enriches citations with source name, title, and URL).
   - If evidence is insufficient, returns exactly: "No recent news" instead of hallucinating.
   - Guardrails prevent non‑context claims and fabrication.

8. UI
   - Simple single-turn chat interface (one question, one answer at a time).
   - Built with Next.js 16 and Vercel AI SDK for streaming tokens.
   - When a new question is submitted, the previous Q&A and citations are cleared.
   - Citation cards show title, source, date, and a clickable URL.
   - `/news` lists stored articles in reverse‑chronological order with title, source, summary, and link.

## Flow

```text
INGESTION PIPELINE
┌─────────────────────────────────┐
│  Fetch & Extract Articles       │
│  (RSS + Firecrawl)              │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Chunk → Embed → Index          │
│  (Postgres + pgvector + FTS)    │
└─────────────────────────────────┘


QUERY PATH (LangGraph Workflow)
┌─────────────────────────────────┐
│  User Question                  │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Detect Temporal Window         │
│  ("today" → 1 day, etc.)        │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Create Query Embedding         │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Hybrid Retrieval               │
│  0.70 vector + 0.30 FTS         │
│  + recency decay                │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  0-40 Candidates                │
└────────────┬────────────────────┘
             │
        [Conditional Routing]
             │
    ┌────────┴────────┐
    │                 │
0 results?      < 10 results?
    │                 │
    ▼                 ▼
  END      ┌─────────────────────┐
"No news"  │  Skip Re-ranking    │
           │  (use all directly) │
           └─────────┬───────────┘
                     │
                ≥ 10 results?
                     │
                     ▼
           ┌─────────────────────┐
           │  LLM Re-ranking     │
           │  (gpt-4o-mini)      │
           │  → Top 8 Chunks     │
           └─────────┬───────────┘
                     │
                     ▼
           ┌─────────────────────┐
           │  LLM Answer Gen     │
           │  (context + cites)  │
           └─────────┬───────────┘
                     │
                     ▼
           ┌─────────────────────┐
           │  Enrich Citations   │
           │  (add metadata)     │
           └─────────┬───────────┘
                     │
                     ▼
           ┌─────────────────────┐
           │  Stream to Chat UI  │
           │  • Answer + cites   │
           │  • Citation cards   │
           └─────────────────────┘
```

## Key technical choices (and why)

- **Next.js 16**: Unified UI + server actions with great DX and streaming.
- **Supabase Postgres**: Local dev simplicity plus hosted Postgres in production.
- **pgvector + Postgres FTS (hybrid retrieval)**: Combines semantic understanding with exact keyword/ticker matching to stay on‑topic for crypto. Simpler than maintaining a purpose-built vector database.
- **OpenAI `text-embedding-3-large` @ 1536 dimensions**: Strong performance on jargon‑heavy crypto content. Using dimensions=1536 (reduced from 3072) retains 95% of semantic quality while enabling HNSW indexing within pgvector 0.8.0's limits. Outperforms text-embedding-3-small at same cost.
- **HNSW (cosine) index with L2‑normalized vectors**: Fast, high‑recall ANN search (Approximate Nearest Neighbor). Built with `m=16, ef_construction=64` for 97-99% recall, superior to IVFFlat.
- **LangGraph 1.0.1 with conditional routing**: Orchestrates the RAG pipeline with smart decision-making. Skips expensive LLM re-ranking when candidate count is low (< 10), optimizing both cost and latency while maintaining quality.
- **Conditional LLM re‑ranking**: Final precision layer for high-candidate scenarios (≥ 10 results) that ensures retrieved chunks truly match intent before answering.
- **Strict citations + context‑only generation**: Trustworthy answers grounded in real articles.

## Security & configuration

- RLS is enabled; server uses the Supabase service role key on the backend.

## User flow

1. User asks: "What happened with the Solana ETF this week?"
2. Previous question, answer, and citations are cleared immediately.
3. System retrieves relevant recent chunks → re‑ranks → generates a concise answer.
4. The response streams to the UI with citations and URLs to the underlying sources.
5. Submitting a new question replaces the entire conversation.

## Notes

- Designed for freshness and relevance in a noisy, fast‑moving domain.
- Runs locally with Supabase in development; production uses a remote Supabase project.

## Tech Stack

### Framework & Runtime

- **Next.js 16** with App Router, server-side rendering
- **TypeScript** with strict type-safety
- **Node.js** (v22)

### UI & Styling

- **HeroUI (NextUI)** - React component library
- **Tailwind CSS** for styling
- **Lucide React** icons

### Database & Storage

- **Supabase** (PostgreSQL database)
- **PostgreSQL** (public access disabled via RLS)

### AI & LLM Integration

- **Vercel AI SDK** - Streaming tokens to UI; server/edge-friendly AI primitives
- **LangChain** - Composable retrieval/reranker/tooling around LLMs
- **LangGraph 1.0.1** - StateGraph with conditional routing for intelligent RAG workflow orchestration. Dynamically skips re-ranking for low-candidate scenarios, optimizing cost and speed.

### Background Jobs

- **Trigger.dev** - Scheduled task runs every 15 minutes to automatically crawl and ingest crypto news (see `docs/scheduled-crawling.md`)
