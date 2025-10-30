/**
 * Main crawler orchestration for crypto news ingestion
 * Reads RSS feeds, scrapes articles with Firecrawl, and stores in Supabase
 */
import { chunkText } from './chunking';
import { generateEmbeddings } from './embeddings';
import { scrapeArticle } from './firecrawl';
import { insertArticle, insertChunks } from './ingestion';
import { parseRssFeed } from './rss-parser';
import { getSupabaseClient } from './supabase';
import { hashUrl } from './url-utils';

/**
 * Statistics from a crawl run
 */
export interface CrawlStats {
  totalSourcesProcessed: number;
  totalArticlesFound: number;
  newArticlesIngested: number;
  existingArticlesSkipped: number;
  totalChunksCreated: number;
  totalTokens: number;
  errors: number;
  errorDetails: Array<{ url: string; error: string }>;
}

/**
 * Main crawler function - orchestrates the entire news ingestion pipeline
 *
 * Process flow:
 * 1. Load all sources from database
 * 2. For each source:
 *    - Parse RSS feed
 *    - Filter articles by date
 *    - Scrape each article with Firecrawl
 *    - Chunk, embed, and store in database
 *    - Update source's last_scraped_at timestamp
 * 3. Return summary statistics
 *
 * @returns Statistics about the crawl run
 */
export async function crawlNews(): Promise<CrawlStats> {
  const supabase = getSupabaseClient();

  // Initialize statistics
  const stats: CrawlStats = {
    totalSourcesProcessed: 0,
    totalArticlesFound: 0,
    newArticlesIngested: 0,
    existingArticlesSkipped: 0,
    totalChunksCreated: 0,
    totalTokens: 0,
    errors: 0,
    errorDetails: [],
  };

  console.log('🚀 Starting news crawler...\n');

  // Load all sources from database
  const { data: sources, error: sourcesError } = await supabase
    .from('sources')
    .select('id, name, rss_url, last_scraped_at')
    .order('name');

  if (sourcesError) {
    throw new Error(`Failed to load sources: ${sourcesError.message}`);
  }

  if (!sources || sources.length === 0) {
    console.log('⚠️  No sources found in database');
    return stats;
  }

  console.log(`📋 Found ${sources.length} sources to process\n`);

  // Process each source sequentially
  for (const source of sources) {
    stats.totalSourcesProcessed++;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📰 Processing: ${source.name}`);
    console.log(`   RSS Feed: ${source.rss_url}`);
    console.log(`   Last scraped: ${source.last_scraped_at || 'Never'}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      // Parse RSS feed
      console.log('📡 Fetching RSS feed...');
      const articles = await parseRssFeed(source.rss_url, source.last_scraped_at);
      stats.totalArticlesFound += articles.length;
      console.log(`   Found ${articles.length} new articles\n`);

      if (articles.length === 0) {
        console.log('   ✅ No new articles to process\n');
        continue;
      }

      // Process each article
      let sourceArticlesIngested = 0;
      let sourceArticlesSkipped = 0;

      for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        console.log(`[${i + 1}/${articles.length}] Processing: ${article.title}`);
        console.log(`   URL: ${article.url}`);
        console.log(`   Published: ${new Date(article.publishedAt).toLocaleString()}`);

        try {
          // Check if article already exists by URL hash
          const urlHash = hashUrl(article.url);
          const { data: existing } = await supabase.from('articles').select('id').eq('url_hash', urlHash).single();

          if (existing) {
            console.log('   ⏭️  Already exists (skipped)\n');
            stats.existingArticlesSkipped++;
            sourceArticlesSkipped++;
            continue;
          }

          // Scrape article with Firecrawl
          console.log('   🔍 Scraping with Firecrawl...');
          const summary = await scrapeArticle(article.url);
          console.log(`   ✅ Extracted ${summary.length} characters`);

          // Insert article into database
          const { id: articleId, isNew } = await insertArticle({
            sourceId: source.id,
            url: article.url,
            title: article.title,
            author: article.author,
            publishedAt: article.publishedAt,
            textSummary: summary,
          });

          if (!isNew) {
            console.log('   ⏭️  Article exists (race condition, skipped)\n');
            stats.existingArticlesSkipped++;
            sourceArticlesSkipped++;
            continue;
          }

          console.log(`   💾 Article saved (ID: ${articleId.substring(0, 8)}...)`);

          // Chunk the text
          const chunks = chunkText(summary);
          console.log(`   📦 Created ${chunks.length} chunks`);

          if (chunks.length === 0) {
            console.warn('   ⚠️  No chunks created (empty text?)\n');
            continue;
          }

          // Generate embeddings for all chunks in batch
          console.log('   🧮 Generating embeddings...');
          const chunkTexts = chunks.map((c) => c.content);
          const embeddings = await generateEmbeddings(chunkTexts);

          // Insert chunks with embeddings and denormalized metadata
          await insertChunks(
            articleId,
            chunks.map((chunk, idx) => ({
              chunkIndex: chunk.chunkIndex,
              content: chunk.content,
              tokenCount: chunk.tokenCount,
              embedding: embeddings[idx],
              // Denormalized metadata
              title: article.title,
              sourceName: source.name,
              publishedAt: article.publishedAt,
            })),
          );

          stats.newArticlesIngested++;
          sourceArticlesIngested++;
          stats.totalChunksCreated += chunks.length;
          stats.totalTokens += chunks.reduce((sum, c) => sum + c.tokenCount, 0);

          console.log(`   ✅ Inserted ${chunks.length} chunks with embeddings\n`);
        } catch (error: unknown) {
          stats.errors++;
          const errorMessage = error instanceof Error ? error.message : String(error);
          stats.errorDetails.push({ url: article.url, error: errorMessage });
          console.error(`   ❌ Error processing article: ${errorMessage}\n`);
          // Continue to next article
        }
      }

      // Update source's last_scraped_at timestamp
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('sources')
        .update({ last_scraped_at: now })
        .eq('id', source.id);

      if (updateError) {
        console.error(`   ⚠️  Failed to update last_scraped_at: ${updateError.message}`);
      } else {
        console.log(`\n📊 Source summary:`);
        console.log(`   New articles: ${sourceArticlesIngested}`);
        console.log(`   Skipped: ${sourceArticlesSkipped}`);
        console.log(`   Last scraped updated: ${now}\n`);
      }
    } catch (error: unknown) {
      stats.errors++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`\n❌ Error processing source ${source.name}: ${errorMessage}\n`);
      // Continue to next source
    }
  }

  return stats;
}
