#!/usr/bin/env tsx
/**
 * Ingestion script for loading mock crypto news articles into Supabase
 *
 * This script:
 * 1. Loads mock articles from data/mock-articles.ts
 * 2. Inserts articles into the database (with deduplication)
 * 3. Chunks article text into paragraphs (250-500 tokens with 10-20% overlap)
 * 4. Generates embeddings using OpenAI text-embedding-3-large (1536 dimensions)
 * 5. Stores chunks with embeddings and denormalized metadata
 *
 * Usage:
 *   npx tsx scripts/mock-ingest.ts
 *
 * Environment variables required:
 *   - SUPABASE_URL
 *   - SUPABASE_API_KEY
 *   - OPENAI_API_KEY
 */
import { loadEnv } from '@/lib/server/load-env';
import { mockArticles } from '../data/mock-articles';
import { chunkText, freeEncoder } from '../lib/server/chunking';
import { generateEmbeddings } from '../lib/server/embeddings';
import { getSources, insertArticle, insertChunks } from '../lib/server/ingestion';

// Validate environment variables
function validateEnv(): void {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_API_KEY || process.env.SUPABASE_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const missing: string[] = [];
  if (!supabaseUrl) missing.push('SUPABASE_URL or SUPABASE_URL');
  if (!supabaseKey) missing.push('SUPABASE_API_KEY or SUPABASE_API_KEY');
  if (!openaiKey) missing.push('OPENAI_API_KEY');

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((key) => console.error(`   - ${key}`));
    process.exit(1);
  }
}

// Main ingestion function
async function ingest(): Promise<void> {
  const startTime = Date.now();

  console.log('🚀 Starting ingestion pipeline...\n');

  loadEnv();
  validateEnv();

  try {
    // Get sources from database
    console.log('📋 Loading sources from database...');
    const sources = await getSources();
    const sourceMap = new Map(sources.map((s) => [s.name, s.id]));
    console.log(`   Found ${sources.length} sources\n`);

    // Statistics
    let totalArticles = 0;
    let newArticles = 0;
    let skippedArticles = 0;
    let totalChunks = 0;
    let totalTokens = 0;

    // Process each article
    for (const mockArticle of mockArticles) {
      totalArticles++;
      const sourceId = sourceMap.get(mockArticle.source_name);

      if (!sourceId) {
        console.warn(`⚠️  Skipping article - unknown source: ${mockArticle.source_name}`);
        skippedArticles++;
        continue;
      }

      console.log(`📰 Processing: ${mockArticle.title}`);
      console.log(`   Source: ${mockArticle.source_name}`);
      console.log(`   URL: ${mockArticle.url}`);

      // Insert article
      const { id: articleId, isNew } = await insertArticle({
        sourceId,
        url: mockArticle.url,
        title: mockArticle.title,
        author: mockArticle.author,
        publishedAt: mockArticle.published_at,
        textSummary: mockArticle.text_summary,
      });

      if (!isNew) {
        console.log('   ⏭️  Article exists (skipped)\n');
        skippedArticles++;
        continue;
      }

      newArticles++;
      console.log(`   ✅ Article inserted (ID: ${articleId.substring(0, 8)}...)`);

      // Chunk the text
      const chunks = chunkText(mockArticle.text_summary);
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
        chunks.map((chunk, i) => ({
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
          tokenCount: chunk.tokenCount,
          embedding: embeddings[i],
          // Denormalized metadata
          title: mockArticle.title,
          sourceName: mockArticle.source_name,
          publishedAt: mockArticle.published_at,
        })),
      );

      totalChunks += chunks.length;
      totalTokens += chunks.reduce((sum, c) => sum + c.tokenCount, 0);

      console.log(`   ✅ Inserted ${chunks.length} chunks with embeddings\n`);
    }

    // Log processing time
    const endTime = Date.now();
    const durationSeconds = ((endTime - startTime) / 1000).toFixed(2);

    // Print summary statistics
    console.log('═══════════════════════════════════════════════════');
    console.log('✨ Ingestion Complete!');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📊 Statistics:`);
    console.log(`   Total articles processed: ${totalArticles}`);
    console.log(`   New articles inserted:    ${newArticles}`);
    console.log(`   Existing articles (skip): ${skippedArticles}`);
    console.log(`   Total chunks created:     ${totalChunks}`);
    console.log(`   Average chunks/article:   ${newArticles > 0 ? (totalChunks / newArticles).toFixed(1) : 0}`);
    console.log(`   Total tokens:             ${totalTokens.toLocaleString()}`);
    console.log(`   Average tokens/chunk:     ${totalChunks > 0 ? Math.round(totalTokens / totalChunks) : 0}`);
    console.log(`   Processing time:          ${durationSeconds} seconds\n`);
    console.log('═══════════════════════════════════════════════════\n');
  } catch (error: unknown) {
    console.error('\n❌ Ingestion failed:', error);
    process.exit(1);
  } finally {
    // Clean up tiktoken encoder
    freeEncoder();
  }
}

// Run the ingestion
ingest();
