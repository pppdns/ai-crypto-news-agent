# Scheduled News Crawling

## Overview

Runs every 15 minutes via Trigger.dev to automatically ingest crypto news articles.

- **Task ID**: `crawl-crypto-news`
- **File**: `trigger/crawl-crypto-news.ts`
- **Schedule**: `*/15 * * * *` (every 15 minutes)
- **Max Duration**: 10 minutes

## How It Works

1. Fetches RSS feeds from all sources
2. Filters articles newer than `last_scraped_at` (max 30 days)
3. Scrapes content with Firecrawl
4. Deduplicates by URL hash
5. Chunks text (250-500 tokens, 10-20% overlap)
6. Generates embeddings (text-embedding-3-large @ 1536d)
7. Stores articles and chunks in Supabase
8. Updates `last_scraped_at` timestamp

## Environment Variables

Set in Trigger.dev dashboard:

- `SUPABASE_URL`
- `SUPABASE_API_KEY`
- `OPENAI_API_KEY`
- `FIRECRAWL_API_KEY`

## Error Handling

- **Non-Critical**: Individual article failures are logged, task continues
- **Critical**: Task fails only if all sources fail or env vars missing

## Testing

```bash
# Standalone script
npx tsx scripts/crawl-news.ts

# Trigger.dev dev mode
npx trigger.dev@latest dev

# Manual trigger
import { tasks } from '@trigger.dev/sdk/v3';
await tasks.trigger('crawl-crypto-news', {});
```

## Monitoring

View runs, logs, and metrics in Trigger.dev dashboard.
