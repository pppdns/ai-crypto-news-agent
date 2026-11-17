/**
 * Frozen retrieval contexts for the offline generation evals (evals/generation.yaml).
 *
 * Each test names the mock articles (by URL slug) that play the role of "retrieved chunks".
 * Article IDs are deterministic UUIDs derived from the article's position in data/mock-articles.ts,
 * and dates are shifted to "recent" so the answer prompt sees fresh news. No database is needed.
 *
 * Usage: buildContextChunks(['solana-etf-application-submitted-sec'], { inject: 'extra text' })
 */
import { mockArticles } from '../../data/mock-articles';
import type { Chunk } from '../../lib/server/rag/types';

const HOUR_MS = 60 * 60 * 1000;
const NEWEST_PUBLISHED_AT = Math.max(...mockArticles.map((a) => new Date(a.published_at).getTime()));

/** Deterministic UUID for the article at `index` in mockArticles. */
export function fixtureArticleId(index: number): string {
  return `a0000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
}

/** Last path segment of the article URL, used as a readable key in eval YAML. */
function slugOf(url: string): string {
  return new URL(url).pathname.split('/').filter(Boolean).pop() ?? url;
}

export interface BuildContextOptions {
  /** Extra chunk appended to the context, e.g. a planted prompt injection. */
  inject?: string;
}

/**
 * Build the chunk list the answer prompt sees for a test.
 * Throws on an unknown slug so typos in the YAML fail loudly instead of silently testing nothing.
 */
export function buildContextChunks(slugs: string[], options: BuildContextOptions = {}): Chunk[] {
  const offset = Date.now() - 6 * HOUR_MS - NEWEST_PUBLISHED_AT;

  const chunks = slugs.map((slug): Chunk => {
    const index = mockArticles.findIndex((a) => slugOf(a.url) === slug);
    if (index === -1) {
      throw new Error(`Unknown fixture article slug: ${slug}`);
    }
    const article = mockArticles[index];
    return {
      id: `chunk-${index}`,
      article_id: fixtureArticleId(index),
      content: article.text_summary.trim(),
      title: article.title,
      source_name: article.source_name,
      published_at: new Date(new Date(article.published_at).getTime() + offset).toISOString(),
      url: article.url,
    };
  });

  if (options.inject) {
    chunks.push({
      id: 'chunk-injected',
      article_id: 'b0000000-0000-4000-8000-000000000001',
      content: options.inject,
      title: 'Market Update',
      source_name: 'Unknown Blog',
      published_at: new Date(Date.now() - 12 * HOUR_MS).toISOString(),
      url: 'https://example.com/market-update',
    });
  }

  return chunks;
}

/** Plain-text view of the context, used by the LLM judge for faithfulness grading. */
export function contextAsText(chunks: Chunk[]): string {
  return chunks.map((c) => `Article ID: ${c.article_id}\nTitle: ${c.title}\n${c.content}`).join('\n\n---\n\n');
}
