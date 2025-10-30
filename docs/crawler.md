# News Crawler Documentation

## Overview

The news crawler automatically ingests cryptocurrency news from RSS feeds, extracts article content using Firecrawl's LLM-powered extraction, and stores the data in Supabase with semantic embeddings for retrieval.

## Architecture

### High-Level Flow

```
RSS Feeds → Parse Articles → Filter by Date → Scrape with Firecrawl
                                                      ↓
                                          Extract Summary Text
                                                      ↓
                               Insert into Database (Deduplicated)
                                                      ↓
                            Chunk Text (Paragraph-based with Overlap)
                                                      ↓
                            Generate Embeddings (OpenAI 1536-dim)
                                                      ↓
                        Store Chunks with Denormalized Metadata
                                                      ↓
                          Update Source Last Scraped Timestamp
```

### Core Components

The crawler is built with modularity and reusability in mind, with each component having a single, well-defined responsibility.

#### 1. Constants (`lib/server/constants.ts`)

Centralized configuration for the entire system:

- **CRAWLING_MAX_ARTICLE_AGE_DAYS**: Maximum age (30 days) for articles to be considered
- **EMBEDDING_MODEL**: OpenAI model used (text-embedding-3-large)
- **EMBEDDING_DIMENSIONS**: Vector size (1536 dimensions for HNSW compatibility)

#### 2. RSS Parser (`lib/server/rss-parser.ts`)

Responsible for parsing RSS feeds and extracting article metadata.

**Key Functions:**

- `parseRssFeed()`: Parses an RSS feed URL and returns filtered article metadata

**Date Filtering Strategy:**

- Two-level filtering approach for efficiency and freshness
- Filter 1: Articles older than 30 days are always excluded
- Filter 2: Articles older than the source's `last_scraped_at` timestamp are excluded (incremental ingestion)
- If no `last_scraped_at` exists, only the 30-day rule applies

**Extracted Metadata:**

- URL (required)
- Title (defaults to "Untitled" if missing)
- Author (optional - uses `creator` field from RSS)
- Published date (required - uses `pubDate` or `isoDate`, skips if missing)

**Feed Format Support:**

- Natively supports RSS 1.0, RSS 2.0, and Atom feeds via rss-parser library
- Custom User-Agent header to avoid 403 errors from bot-blocking servers
- Defaults to RSS 2.0 for feeds that don't explicitly declare their version
- Handles feeds with non-standard attributes (e.g., Cointelegraph missing version attribute)

**Error Handling:**

- Skips items without URLs or dates
- Validates date parsing
- Throws descriptive error if feed cannot be fetched

#### 3. Firecrawl Integration (`lib/server/firecrawl.ts`)

Handles web scraping and content extraction using Firecrawl's API.

**Key Functions:**

- `scrapeArticle()`: Scrapes a URL and returns the LLM-generated summary text

**Why Firecrawl?**

- LLM-powered extraction produces clean, normalized text, stripped from noise
- Handles complex HTML structures
- Built-in retry logic and rate limiting
- Returns structured summaries ideal for embeddings

**Format Used:**

- Uses `summary` format for concise, LLM-generated article summaries to normalize text and strip off noise -> get clean data
- Typical summary length: 300-800 words
- Removes ads, navigation, boilerplate content, and all the noise

**Error Handling:**

- Firecrawl handles retries internally (no custom retry logic needed)
- Throws error if scraping fails or no summary is returned
- Error messages include the problematic URL for debugging

#### 4. Main Crawler (`lib/server/crawler.ts`)

Orchestrates the entire ingestion pipeline.

**Key Functions:**

- `crawlNews()`: Main entry point that coordinates all steps and returns statistics

**Process Flow:**

1. **Load Sources**: Fetches all sources from database with their RSS URLs and last scraped timestamps

2. **Sequential Processing**: Processes each source one at a time (not parallelized yet)

3. **Per Source:**
   - Parse RSS feed with date filtering
   - Check each article's existence by URL hash (fast deduplication)
   - Scrape new articles with Firecrawl
   - Insert article record into database
   - Chunk the summary text (paragraph-based, 250-500 tokens with 10-20% overlap)
   - Generate embeddings in batch (all chunks for an article at once)
   - Insert chunks with denormalized metadata (title, source name, published date)
   - Update source's `last_scraped_at` timestamp

4. **Error Recovery**: If an article fails to scrape or process, the error is logged and the crawler continues to the next article

5. **Return Statistics**: Comprehensive stats including articles processed, chunks created, tokens counted, and error details

**Deduplication Strategy:**

- URLs are normalized before hashing (lowercase host, no query params, no trailing slash)
- MD5 hash is computed and checked before scraping (saves API calls)
- Race condition handling: if an article is inserted between check and insert, it's detected and skipped

**Statistics Tracked:**

- Total sources processed
- Total articles found in RSS feeds
- New articles ingested
- Existing articles skipped
- Total chunks created
- Total tokens processed
- Error count and details (URL + error message)

#### 5. CLI Script (`scripts/crawl-news.ts`)

Command-line interface for running the crawler.

**Features:**

- Environment variable validation before starting
- Progress logging during execution
- Final statistics summary with formatted output
- Error details display (first 10 errors)
- Proper exit codes (0 for success, 1 for failure)
- Cleanup of tiktoken encoder resources

**Required Environment Variables:**

- `SUPABASE_URL`
- `SUPABASE_API_KEY`
- `OPENAI_API_KEY`
- `FIRECRAWL_API_KEY`

## Database Schema

### Sources Table

Stores RSS feed sources with crawl tracking:

- `id`: UUID primary key
- `name`: Source name (e.g., "Cointelegraph")
- `homepage_url`: Website home page
- `rss_url`: RSS feed URL
- `last_scraped_at`: Timestamp of last successful crawl (NULL = never scraped)
- `created_at`: Record creation timestamp

**Purpose of `last_scraped_at`:**

- Enables incremental ingestion (only process new articles)
- Updated after successfully processing all articles from a source
- Used to filter RSS feed items in subsequent runs

### Articles Table

Stores article metadata and summary text:

- `id`: UUID primary key
- `source_id`: Foreign key to sources
- `url`: Original article URL
- `url_hash`: MD5 hash of normalized URL (unique constraint for deduplication)
- `title`: Article title
- `author`: Article author (optional)
- `published_at`: Publication timestamp
- `fetched_at`: When the article was scraped
- `text_summary`: LLM-generated clean summary text (source for chunks)
- `tsvector`: Full-text search vector (auto-generated from title + summary)

### Article Chunks Table

Stores paragraph chunks with embeddings and denormalized metadata:

- `id`: UUID primary key
- `article_id`: Foreign key to articles
- `chunk_index`: Sequential chunk number (0-based)
- `content`: Plain text content of the chunk
- `embedding`: 1536-dimensional vector for semantic search
- `token_count`: Number of tokens in the chunk
- `title`: Denormalized article title (for query performance)
- `source_name`: Denormalized source name (for query performance)
- `published_at`: Denormalized publication date (for recency filtering)

**Why Denormalize?**

- Avoids JOINs during hybrid search queries
- Enables efficient filtering by date and source directly on chunks
- Improves query performance for the RAG pipeline

## Ingestion Strategy

### Sequential Processing

The crawler processes sources and articles sequentially (one at a time) for simplicity and reliability:

**Benefits:**

- Easier to debug and monitor
- No rate limiting complexity
- Predictable resource usage
- Simple error handling

**Future Optimization:**

- Parallel source processing (process multiple RSS feeds simultaneously)
- Batch article scraping with rate limiting
- These optimizations are planned but not yet implemented

### Incremental Ingestion

The `last_scraped_at` timestamp enables efficient incremental updates:

**First Run:**

- All sources have `last_scraped_at = NULL`
- Crawler processes all articles from the last 30 days
- After processing, `last_scraped_at` is set to current timestamp

**Subsequent Runs:**

- RSS parser filters out articles older than `last_scraped_at`
- Only new articles since last run are processed
- Significantly reduces API calls and processing time

**Example Timeline:**

- Monday 10 AM: First run, processes 50 articles
- Monday 6 PM: Second run, processes 8 new articles since 10 AM
- Tuesday 10 AM: Third run, processes 15 new articles since Monday 6 PM

## Error Handling

### Design Philosophy

The crawler is designed to be resilient and continue processing even when individual articles fail:

**Fail-Fast Components:**

- Environment variable validation (fails immediately if keys are missing)
- Database connection (fails if Supabase is unavailable)
- Source loading (fails if sources table cannot be queried)

**Fail-Gracefully Components:**

- RSS feed parsing (logs error, skips source, continues)
- Article scraping (logs error, skips article, continues)
- Embedding generation (logs error, skips article, continues)
- Database insertion (handles race conditions, continues)

### Error Tracking

Every error is captured in the statistics object:

- Total error count
- Array of error details (URL + error message)
- Displayed in final summary for review

### Retry Strategy

Retries are handled automatically by underlying services:

- **Firecrawl**: Has built-in retry logic with exponential backoff
- **OpenAI**: SDK handles rate limiting and retries
- **Supabase**: Connection pooling and automatic reconnection

The crawler itself does not implement additional retry logic to keep the code simple and avoid duplicate retry attempts.

## Usage

### Running the Crawler

Execute the CLI script from the project root:

```bash
npx tsx scripts/crawl-news.ts
```

### Expected Output

```
═══════════════════════════════════════════════════
🤖 Crypto News Crawler
═══════════════════════════════════════════════════

🚀 Starting news crawler...

📋 Found 6 sources to process

============================================================
📰 Processing: Cointelegraph
   RSS Feed: https://cointelegraph.com/rss
   Last scraped: Never
============================================================

📡 Fetching RSS feed...
   Found 25 new articles

[1/25] Processing: Bitcoin Reaches New All-Time High
   URL: https://cointelegraph.com/news/bitcoin-new-ath
   Published: 10/30/2025, 8:15:23 AM
   🔍 Scraping with Firecrawl...
   ✅ Extracted 1842 characters
   💾 Article saved (ID: d4e05744...)
   📦 Created 3 chunks
   🧮 Generating embeddings...
   ✅ Inserted 3 chunks with embeddings

...

═══════════════════════════════════════════════════
✨ Crawl Complete!
═══════════════════════════════════════════════════
📊 Statistics:
   Sources processed:        6
   Articles found:           134
   New articles ingested:    90
   Existing articles (skip): 44
   Total chunks created:     276
   Average chunks/article:   3.1
   Total tokens:             73,484
   Average tokens/chunk:     266
   Errors:                   4
   Processing time:          254.90 seconds
═══════════════════════════════════════════════════
```

### Integration with Other Systems

The crawler is designed to be callable from multiple contexts:

**Current:**

- CLI script for manual runs or cron jobs

**Future:**

- Trigger.dev background jobs for scheduled ingestion
- API endpoint for on-demand crawls
- Admin dashboard for monitoring and control

## Configuration

### Environment Variables

All configuration is managed through environment variables in `.env.local`:

```bash
# OpenAI API Key (for embeddings)
OPENAI_API_KEY=sk-proj-...

# Firecrawl API Key (for article extraction)
FIRECRAWL_API_KEY=fc-...

# Supabase Configuration
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_API_KEY=your-secret-key-here
```

### Adjustable Constants

Modify `lib/server/constants.ts` to change behavior:

- **CRAWLING_MAX_ARTICLE_AGE_DAYS**: Increase to process older articles (affects storage)
- **EMBEDDING_DIMENSIONS**: Must match database vector size (requires migration)
- **EMBEDDING_MODEL**: Can switch to different OpenAI model (may affect quality)

**Note:** Changing embedding settings requires re-ingesting all articles and updating database schema.

## Performance Characteristics

### Processing Speed

Typical performance metrics (varies based on network and API response times):

- RSS parsing: ~1-2 seconds per feed
- Firecrawl scraping: ~3-5 seconds per article
- Embedding generation: ~1-2 seconds per batch (multiple chunks)
- Database insertion: ~0.5 seconds per article (including chunks)

**Overall:** Approximately 5-8 seconds per article end-to-end

### Resource Usage

- **Memory**: ~100-200 MB (mostly from embeddings and tiktoken)
- **Network**: Bandwidth depends on article count (Firecrawl + OpenAI API)
- **Database**: ~10-20 KB per article (including chunks and embeddings)

### Scalability Considerations

**Current Limitations:**

- Sequential processing limits throughput
- No rate limiting (relies on API providers)
- Single-threaded execution

**Future Optimizations:**

- Parallel source processing (10x speedup)
- Batch article scraping with controlled concurrency
- Streaming embeddings to reduce memory usage
- Connection pooling and query optimization

## Maintenance

### Monitoring

Key metrics to monitor in production:

- **Success Rate**: Percentage of articles successfully ingested
- **Error Rate**: Number of failures per source
- **Processing Time**: Duration per run (detect performance degradation)
- **Article Count**: Number of new articles per source (detect feed issues)
- **Storage Growth**: Database size growth rate

### Troubleshooting

**Common Issues:**

1. **No articles found**
   - Check RSS feed URLs are valid
   - Verify `last_scraped_at` isn't blocking new articles
   - Confirm articles are within the 30-day window

2. **Firecrawl errors**
   - Verify API key is valid
   - Check API quota and rate limits
   - Some sites may block Firecrawl (URL blacklisting)

3. **Embedding failures**
   - Verify OpenAI API key and quota
   - Check for rate limiting (429 errors)
   - Ensure text chunks are within token limits

4. **Database insertion errors**
   - Check Supabase connection and credentials
   - Verify database schema matches code expectations
   - Look for unique constraint violations

## Limitations and Future Work

### Current Limitations

1. **No Pagination**: RSS feeds return limited items (typically 20-200 most recent)
2. **Sequential Processing**: Slow for large numbers of articles
3. **No Priority Queue**: All articles treated equally
4. **Limited Error Recovery**: Failed articles are skipped permanently
5. **No Deduplication Across Sources**: Same news from multiple sources creates duplicates

### Planned Enhancements

1. **Parallel Processing**: Process multiple sources and articles concurrently
2. **Scheduled Execution**: Built-in cron-like scheduling
3. **Admin Dashboard**: Web UI for monitoring and control
