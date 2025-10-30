import { logger, schedules } from '@trigger.dev/sdk/v3';
import { freeEncoder } from '@/lib/server/chunking';
import { crawlNews } from '@/lib/server/crawler';

/**
 * Scheduled task to crawl crypto news every 15 minutes
 *
 * This task:
 * - Runs every 15 minutes
 * - Fetches articles from RSS feeds
 * - Scrapes content using Firecrawl
 * - Stores articles with embeddings in Supabase
 *
 * Environment variables required (set in Trigger.dev dashboard):
 * - SUPABASE_URL
 * - SUPABASE_API_KEY
 * - OPENAI_API_KEY
 * - FIRECRAWL_API_KEY
 */
export const crawlCryptoNewsTask = schedules.task({
  id: 'crawl-crypto-news',
  // Run every 15 minutes
  cron: '*/15 * * * *',
  // Set max duration to 10 minutes (allow plenty of time for scraping)
  maxDuration: 600, // 10 minutes in seconds
  run: async (payload) => {
    const startTime = Date.now();

    logger.log('Starting crypto news crawl', {
      timestamp: payload.timestamp,
      lastRun: payload.lastTimestamp,
      timezone: payload.timezone,
      scheduleId: payload.scheduleId,
    });

    // Validate required environment variables
    const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_API_KEY', 'OPENAI_API_KEY', 'FIRECRAWL_API_KEY'];
    const missing = requiredEnvVars.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      const errorMsg = `Missing required environment variables: ${missing.join(', ')}`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      // Run the crawler
      console.log('═══════════════════════════════════════════════════');
      console.log('🤖 Crypto News Crawler');
      console.log('═══════════════════════════════════════════════════\n');

      const stats = await crawlNews();

      // Calculate processing time
      const endTime = Date.now();
      const durationSeconds = ((endTime - startTime) / 1000).toFixed(2);

      // Log final summary
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

      // Log structured summary for Trigger.dev
      logger.log('Crawl completed successfully', {
        stats: {
          sourcesProcessed: stats.totalSourcesProcessed,
          articlesFound: stats.totalArticlesFound,
          newArticles: stats.newArticlesIngested,
          existingArticles: stats.existingArticlesSkipped,
          chunksCreated: stats.totalChunksCreated,
          totalTokens: stats.totalTokens,
          errors: stats.errors,
          durationSeconds: parseFloat(durationSeconds),
        },
      });

      // Determine if this should be considered a critical failure
      // Only fail if we couldn't process any sources or had a complete failure
      if (stats.totalSourcesProcessed === 0) {
        throw new Error(
          'Critical failure: No sources could be processed. Check Supabase connection and sources table.',
        );
      }

      // Return summary statistics
      return {
        success: true,
        sourcesProcessed: stats.totalSourcesProcessed,
        articlesFound: stats.totalArticlesFound,
        newArticlesIngested: stats.newArticlesIngested,
        existingArticlesSkipped: stats.existingArticlesSkipped,
        chunksCreated: stats.totalChunksCreated,
        totalTokens: stats.totalTokens,
        errors: stats.errors,
        errorRate: stats.totalArticlesFound > 0 ? ((stats.errors / stats.totalArticlesFound) * 100).toFixed(2) : '0.00',
        durationSeconds: parseFloat(durationSeconds),
        timestamp: payload.timestamp.toISOString(),
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Crawl failed with critical error', { error: errorMessage });

      // Log the error but ensure encoder cleanup happens
      throw error;
    } finally {
      // Always clean up the tiktoken encoder
      freeEncoder();
      logger.log('Tiktoken encoder cleaned up');
    }
  },
});
