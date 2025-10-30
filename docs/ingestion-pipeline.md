# Ingestion Pipeline Documentation

## Overview

The ingestion pipeline processes crypto news articles from RSS feeds and stores them in Supabase with embeddings. There are two ingestion methods:

1. **Manual News Crawler** (`scripts/crawl-news.ts`) - For on-demand crawling from RSS feeds
2. **Scheduled Crawler** (`trigger/crawl-crypto-news.ts`) - **Recommended**: Automated crawling every 15 minutes via Trigger.dev

## Usage

### Manual News Crawler (On-Demand)

For manual crawling from RSS feeds (useful for testing or one-off updates):

```bash
npx tsx scripts/crawl-news.ts
```

This script:

- Fetches articles from all configured RSS feeds
- Scrapes content using Firecrawl
- Chunks and embeds the text
- Stores everything in Supabase

See [Crawler Documentation](./crawler.md) for detailed implementation information.

### Scheduled Crawler (Production - Recommended)

The production system uses a Trigger.dev scheduled task that runs every 15 minutes automatically:

- **Task ID**: `crawl-crypto-news`
- **File**: `trigger/crawl-crypto-news.ts`
- **Schedule**: Every 15 minutes (cron: `*/15 * * * *`)
- **Max Duration**: 10 minutes
- **Retry Policy**: 2 attempts with exponential backoff
- **Documentation**: See [Scheduled Crawling](./scheduled-crawling.md)

This is the recommended approach for production as it:

- Ensures continuous fresh data ingestion
- Handles failures gracefully with retries
- Provides monitoring and logging via Trigger.dev dashboard
- Requires no manual intervention
- Automatically updates `last_scraped_at` timestamp per source for incremental crawling

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

#### 6. RSS Parser (`lib/server/rss-parser.ts`)

- Fetches and parses RSS feeds from crypto news sources
- Filters articles by `last_scraped_at` timestamp (incremental crawling)
- Respects `CRAWLING_MAX_ARTICLE_AGE_DAYS` (default: 30 days)
- Extracts title, URL, author, and published date

#### 7. Firecrawl Scraper (`lib/server/firecrawl.ts`)

- Scrapes article content using Firecrawl API
- Extracts clean text summary using LLM
- Returns normalized article text without HTML

#### 8. Main Crawler (`lib/server/crawler.ts`)

- Orchestrates the complete pipeline
- Processes all sources sequentially
- Updates `last_scraped_at` after each source
- Tracks statistics and error details

## Data Flow

```
RSS Feeds → Parse Feed → Filter by Date → For each article:
                                              ↓
                                     Check if exists by URL hash
                                              ↓
                                     Scrape with Firecrawl (LLM extraction)
                                              ↓
                                     Insert Article → Get article ID
                                              ↓
                                     Chunk Text (250-500 tokens, 10-20% overlap)
                                              ↓
                                     Generate Embeddings (batch, 1536 dims, L2-normalized)
                                              ↓
                                     Insert Chunks with denormalized metadata
                                              ↓
                                     Update source.last_scraped_at
```

## Idempotency

The pipeline is fully idempotent:

- Articles are deduplicated by URL hash
- Re-running the script skips existing articles
- No chunks are inserted for existing articles

## Results

### Example Successful Run Statistics

```
📊 Statistics:
   Sources processed:        6
   Articles found:           45
   New articles ingested:    38
   Existing articles (skip): 7
   Total chunks created:     412
   Average chunks/article:   10.8
   Total tokens:             95,847
   Average tokens/chunk:     233
   Errors:                   0
   Processing time:          142.35 seconds
```

### Database Verification

After a successful crawl run:

- ✅ Articles in `articles` table with unique `url_hash`
- ✅ Chunks in `article_chunks` table with 1536-dim embeddings
- ✅ All embeddings L2-normalized for cosine similarity
- ✅ Denormalized metadata present (title, source_name, published_at)
- ✅ `last_scraped_at` updated for each source
- ✅ Full-text search index (`tsvector`) auto-generated on articles

## Key Features

1. **RSS-Based Ingestion**: Automatically discovers new articles from configured sources
2. **Incremental Crawling**: Tracks `last_scraped_at` per source to avoid re-processing
3. **Firecrawl Integration**: LLM-powered content extraction from HTML
4. **Accurate Token Counting**: Uses tiktoken (OpenAI's official tokenizer)
5. **Efficient Embeddings**: Batch generation with OpenAI SDK
6. **Optimal Vector Size**: 1536 dimensions for HNSW index compatibility
7. **Idempotent**: Safe to re-run without duplicates (URL hash deduplication)
8. **Denormalized Metadata**: Optimized for query performance
9. **L2-Normalized Embeddings**: Ready for cosine similarity search
10. **Error Handling**: Continues processing even if individual articles fail
11. **Comprehensive Logging**: Detailed progress and statistics tracking

## Dependencies

- `tsx`: Run TypeScript files directly
- `tiktoken`: Accurate OpenAI token counting
- `openai`: Official OpenAI SDK for embeddings
- `rss-parser`: Parse RSS/Atom feeds
- `@mendable/firecrawl-js`: Article content extraction
- `@trigger.dev/sdk`: Scheduled task orchestration (production)

## Environment Variables

Required for both manual and scheduled crawling:

- `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `SUPABASE_API_KEY` or `SUPABASE_SECRET_KEY`: Service role key (bypasses RLS)
- `OPENAI_API_KEY`: OpenAI API key for embeddings
- `FIRECRAWL_API_KEY`: Firecrawl API key for content extraction

Optional configuration:

- `CRAWLING_MAX_ARTICLE_AGE_DAYS`: Maximum article age to crawl (default: 30 days)
