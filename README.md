## AI Chat Agent for Crypto News

A Next.js application that answers crypto questions using fresh, grounded news. It ingests articles from major crypto publishers, indexes them with vectors and full‑text search, retrieves and re‑ranks the most relevant passages, and generates concise answers with strict citations.

## How it works

1. Ingestion
   - Fetches RSS items from Cointelegraph, CryptoPotato, and NewsBTC, then loads article HTML.
   - Extracts a clean plain‑text summary per article (via Firecrawl).
   - Persists article metadata and summary to Supabase Postgres.

2. Chunking
   - Splits the article summary into paragraph‑sized chunks targeting 250–500 tokens with ~10–20% overlap.

3. Embeddings
   - Uses OpenAI `text-embedding-3-large` (dimension 3072). Note: `text-embedding-3-small` may be enough too

4. Storage & Indexing
   - Tables
     - `sources(id, name, homepage_url, rss_url)`
     - `articles(id, source_id, url, url_hash, title, author, published_at, fetched_at, text_summary, tsvector)`
     - `article_chunks(id, article_id, chunk_index, content, title, source_name, published_at, embedding, token_count)`
   - Indexes
     - pgvector HNSW (cosine) on `article_chunks.embedding` for fast semantic search
     - GIN index on `articles.tsvector` for keyword/FTS (Full Text Search)
     - Recency index on `articles.published_at`

5. Retrieval (Hybrid SQL)
   - Creates a query embedding, searches top candidates using a normalized blend:
     - 0.70 vector similarity + 0.30 FTS rank
     - Applies gentle recency decay; defaults to a 14–30 day window, shrinks to ~48–72 hours when the query implies “latest/today/this week”.
   - Returns top 40 chunk candidates.

6. Re‑ranking
   - Uses an LLM scoring pass (`gpt-4o-mini`) over query + chunk text.
   - Selects the final top 8 chunks for answer context.

7. Answer generation
   - Generates a concise response using only the provided context.
   - Every claim is cited with the `articles` table ID and date (the backend enriches citations with source name, title, and URL).
   - If evidence is insufficient, returns exactly: "No recent news" instead of hallucinating.
   - Guardrails prevent non‑context claims and fabrication.

8. UI
   - Simple chat built with Next.js 16 and Vercel AI SDK for streaming tokens.
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


QUERY PATH
┌─────────────────────────────────┐
│  User Question                  │
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
│  Top 40 Candidates              │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  LLM Re-ranking                 │
│  (gpt-4o-mini)                  │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Top 8 Chunks                   │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  LLM Answer Generation          │
│  (context-only, with citations) │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Stream to Chat UI              │
│  • Answer with citations        │
│  • Citation cards (title, URL)  │
│  • Or "No recent news"          │
└─────────────────────────────────┘
```

## Key technical choices (and why)

- **Next.js 16**: Unified UI + server actions with great DX and streaming.
- **Supabase Postgres**: Local dev simplicity plus hosted Postgres in production.
- **pgvector + Postgres FTS (hybrid retrieval)**: Combines semantic understanding with exact keyword/ticker matching to stay on‑topic for crypto. Simpler than maintaining a purpose-built vector database.
- **OpenAI `text-embedding-3-large`**: Strong performance on jargon‑heavy crypto content; 3072‑dim vectors improve recall. Note: `text-embedding-3-small` may be enough too.
- **HNSW (cosine) index with L2‑normalized vectors**: Fast, high‑recall ANN search (Approximate Nearest Neighbor).
- **LLM re‑ranking**: Final precision layer that ensures retrieved chunks truly match intent before answering.
- **Strict citations + context‑only generation**: Trustworthy answers grounded in real articles.

## Security & configuration

- RLS is enabled; server uses the Supabase service role key on the backend.

## User flow

1. User asks: “What happened with the Solana ETF this week?”
2. System retrieves relevant recent chunks → re‑ranks → generates a concise answer.
3. The response includes citations and URLs to the underlying sources.

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
- **LangGraph** - Orchestrates multi-step, stateful RAG workflows and retries

### Background Jobs

- **Trigger.dev** - For background data ingestion tasks
