# Trigger.dev Deployment

## Setup Environment Variables

In your Trigger.dev dashboard (Project Settings → Environment Variables), add:

```
SUPABASE_URL=your_supabase_url
SUPABASE_API_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
FIRECRAWL_API_KEY=your_firecrawl_key
```

## Deploy

```bash
npx trigger.dev@latest deploy
```

This builds, uploads, and activates your scheduled task automatically.

## Verify

1. Go to Trigger.dev dashboard
2. Navigate to **Tasks** → `crawl-crypto-news`
3. Check **Schedules** tab (should show active every 15 minutes)
4. View **Runs** for execution history

## Test Manually

1. Go to **Tasks** → `crawl-crypto-news`
2. Click **Test** button
3. Click **Run test** (no payload needed)

## Local Development

```bash
# Run with Trigger.dev dev server
npx trigger.dev@latest dev

# Or run standalone script
npx tsx scripts/crawl-news.ts
```

## What It Does

Every 15 minutes, the task:

1. Fetches RSS feeds from configured sources
2. Scrapes new articles with Firecrawl
3. Chunks content and generates embeddings
4. Stores in Supabase
5. Updates `last_scraped_at` timestamp

## Task Configuration

- **File**: `trigger/crawl-crypto-news.ts`
- **Schedule**: `*/15 * * * *` (every 15 minutes)
- **Timezone**: UTC
- **Max Duration**: 10 minutes

## Modify & Redeploy

After changes, redeploy:

```bash
npx trigger.dev@latest deploy
```
