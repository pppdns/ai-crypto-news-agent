# Ingestion Pipeline Documentation

## Overview

The ingestion pipeline processes crypto news articles and stores them in Supabase with embeddings. There are three ingestion methods:

1. **Mock Data Ingestion** (`scripts/ingest.ts`) - For testing with pre-defined articles
2. **Manual News Crawler** (`scripts/crawl-news.ts`) - For on-demand crawling from RSS feeds
3. **Scheduled Crawler** (`trigger/crawl-crypto-news.ts`) - **Recommended**: Automated crawling every 15 minutes via Trigger.dev

## Usage

### Mock Data Ingestion (Testing)

For testing and development with mock articles:

```bash
npx tsx scripts/ingest.ts
```

### Manual News Crawler (On-Demand)

For manual crawling from RSS feeds:

```bash
npx tsx scripts/crawl-news.ts
```

See [Crawler Documentation](./crawler.md) for details on the production crawler.

### Scheduled Crawler (Production - Recommended)

The production system uses a Trigger.dev scheduled task that runs every 15 minutes automatically:

- **Task ID**: `crawl-crypto-news`
- **File**: `trigger/crawl-crypto-news.ts`
- **Schedule**: Every 15 minutes
- **Documentation**: See [Scheduled Crawling](./scheduled-crawling.md)

This is the recommended approach for production as it:

- Ensures continuous fresh data ingestion
- Handles failures gracefully with retries
- Provides monitoring and logging via Trigger.dev dashboard
- Requires no manual intervention

## Architecture

### Core Components

#### 1. Supabase Client (`lib/server/supabase.ts`)

- Creates server-side Supabase client using `SUPABASE_SECRET_KEY` or `SUPABASE_API_KEY`
- Bypasses RLS policies for backend operations
- Supports both `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_URL` environment variables

#### 2. URL Utils (`lib/server/url-utils.ts`)

- **`normalizeUrl()`**: Strips query params, lowercases host, removes trailing slash
- **`hashUrl()`**: Generates MD5 hash for fast deduplication

#### 3. Text Chunking (`lib/server/chunking.ts`)

- **`chunkText()`**: Splits text into paragraphs (250-500 tokens)
- **10-20% overlap** between consecutive chunks
- Uses **tiktoken** (`cl100k_base` encoding) for accurate OpenAI token counting
- Handles large paragraphs by splitting into sentences

#### 4. Embeddings (`lib/server/embeddings.ts`)

- **`generateEmbeddings()`**: Batch generates embeddings using OpenAI SDK
- Model: `text-embedding-3-large`
- Dimensions: **1536** (reduced from 3072 for pgvector 0.8.0 HNSW compatibility)
- **L2-normalizes** embeddings for cosine similarity

#### 5. Database Ingestion (`lib/server/ingestion.ts`)

- **`insertArticle()`**: Inserts article with deduplication (returns `{id, isNew}`)
- **`insertChunks()`**: Batch inserts chunks with denormalized metadata
- **`getSources()`**: Fetches sources from database

#### 6. Main Script (`scripts/ingest.ts`)

- Orchestrates the complete pipeline
- Loads environment variables from `.env.local`
- Processes all mock articles
- Logs progress and statistics

## Data Flow

```
Mock Articles → Insert Article → Check Existing → Skip if exists
                     ↓
              New Article
                     ↓
              Chunk Text (250-500 tokens with overlap)
                     ↓
              Generate Embeddings (batch, 1536 dims)
                     ↓
              Insert Chunks with denormalized metadata
```

## Idempotency

The pipeline is fully idempotent:

- Articles are deduplicated by URL hash
- Re-running the script skips existing articles
- No chunks are inserted for existing articles

## Results

### Successful Run Statistics

```
📊 Statistics:
   Total articles processed: 36
   New articles inserted:    36
   Existing articles (skip): 0
   Total chunks created:     41
   Average chunks/article:   1.1
   Total tokens:             10,775
   Average tokens/chunk:     263
```

### Database Verification

- ✅ 36 articles in `articles` table
- ✅ 41 chunks in `article_chunks` table
- ✅ All embeddings stored as vector(1536)
- ✅ Denormalized metadata present (title, source_name, published_at)

## Key Features

1. **Accurate Token Counting**: Uses tiktoken (OpenAI's official tokenizer)
2. **Efficient Embeddings**: Batch generation with OpenAI SDK
3. **Optimal Vector Size**: 1536 dimensions for HNSW index compatibility
4. **Idempotent**: Safe to re-run without duplicates
5. **Denormalized Metadata**: Optimized for query performance
6. **L2-Normalized Embeddings**: Ready for cosine similarity search

## Dependencies

- `tsx`: Run TypeScript files directly
- `tiktoken`: Accurate OpenAI token counting
- `openai`: Official OpenAI SDK for embeddings
- `nextjs`: Load environment variables

## Next Steps

1. Implement hybrid search (vector + FTS)
2. Add re-ranking with LLM
3. Build answer generation with citations
4. Create chat UI
