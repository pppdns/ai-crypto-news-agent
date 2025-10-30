#!/usr/bin/env tsx
/**
 * News crawler CLI script
 *
 * This script crawls crypto news from RSS feeds, scrapes article content
 * using Firecrawl, and stores the data in Supabase with embeddings.
 *
 * Usage:
 *   npx tsx scripts/crawl-news.ts
 *
 * Environment variables required:
 *   - SUPABASE_URL
 *   - SUPABASE_API_KEY
 *   - OPENAI_API_KEY
 *   - FIRECRAWL_API_KEY
 */
import { freeEncoder } from '@/lib/server/chunking';
import { crawlNews } from '@/lib/server/crawler';
import { loadEnv } from '@/lib/server/load-env';

/**
 * Validate that all required environment variables are set
 */
function validateEnv(): void {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;

  const missing: string[] = [];
  if (!supabaseUrl) missing.push('SUPABASE_URL');
  if (!supabaseKey) missing.push('SUPABASE_API_KEY');
  if (!openaiKey) missing.push('OPENAI_API_KEY');
  if (!firecrawlKey) missing.push('FIRECRAWL_API_KEY');

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error('\nPlease set these in your .env.local file');
    process.exit(1);
  }
}

/**
 * Main crawler execution
 */
async function main(): Promise<void> {
  const startTime = Date.now();

  console.log('═══════════════════════════════════════════════════');
  console.log('🤖 Crypto News Crawler');
  console.log('═══════════════════════════════════════════════════\n');

  // Load environment variables
  loadEnv();
  validateEnv();

  try {
    // Run the crawler
    const stats = await crawlNews();

    // Calculate processing time
    const endTime = Date.now();
    const durationSeconds = ((endTime - startTime) / 1000).toFixed(2);

    // Print final summary statistics
    console.log('\n═══════════════════════════════════════════════════');
    console.log('✨ Crawl Complete!');
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 Statistics:');
    console.log(`   Sources processed:        ${stats.totalSourcesProcessed}`);
    console.log(`   Articles found:           ${stats.totalArticlesFound}`);
    console.log(`   New articles ingested:    ${stats.newArticlesIngested}`);
    console.log(`   Existing articles (skip): ${stats.existingArticlesSkipped}`);
    console.log(`   Total chunks created:     ${stats.totalChunksCreated}`);
    console.log(
      `   Average chunks/article:   ${stats.newArticlesIngested > 0 ? (stats.totalChunksCreated / stats.newArticlesIngested).toFixed(1) : 0}`,
    );
    console.log(`   Total tokens:             ${stats.totalTokens.toLocaleString()}`);
    console.log(
      `   Average tokens/chunk:     ${stats.totalChunksCreated > 0 ? Math.round(stats.totalTokens / stats.totalChunksCreated) : 0}`,
    );
    console.log(`   Errors:                   ${stats.errors}`);
    console.log(`   Processing time:          ${durationSeconds} seconds`);

    // Show error details if any
    if (stats.errors > 0 && stats.errorDetails.length > 0) {
      console.log('\n⚠️  Error Details:');
      stats.errorDetails.slice(0, 10).forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.url}`);
        console.log(`      ${err.error}`);
      });
      if (stats.errorDetails.length > 10) {
        console.log(`   ... and ${stats.errorDetails.length - 10} more errors`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════\n');

    // Exit with success
    process.exit(0);
  } catch (error: unknown) {
    console.error('\n❌ Crawler failed:', error);
    process.exit(1);
  } finally {
    // Clean up tiktoken encoder
    freeEncoder();
  }
}

// Run the crawler
main();
