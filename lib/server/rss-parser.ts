/**
 * RSS feed parser for crypto news sources
 * Parses RSS feeds and extracts article metadata with date filtering
 */
import Parser, { type Item as RssItem } from 'rss-parser';
import { CRAWLING_MAX_ARTICLE_AGE_DAYS } from './constants';

/**
 * Parsed article metadata from RSS feed
 */
export interface RssArticle {
  url: string;
  title: string;
  author?: string;
  publishedAt: string; // ISO 8601 format
}

/**
 * Parse an RSS feed and extract article metadata
 * Filters articles based on date constraints
 *
 * @param feedUrl - URL of the RSS feed to parse
 * @param lastScrapedAt - Optional timestamp of last successful crawl (filters older articles)
 * @returns Array of article metadata that should be scraped
 */
export async function parseRssFeed(feedUrl: string, lastScrapedAt?: string | null): Promise<RssArticle[]> {
  const parser = new Parser({
    timeout: 10000, // 10 second timeout
    // Set custom headers to avoid 403 errors from servers that block bots
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; CryptoNewsBot/1.0; +https://example.com/bot)',
      Accept: 'application/rss+xml, application/xml, application/atom+xml, text/xml, */*',
    },
  });

  try {
    const feed = await parser.parseURL(feedUrl);
    const articles: RssArticle[] = [];

    // Calculate the cutoff date (30 days ago)
    const maxAgeDate = new Date();
    maxAgeDate.setDate(maxAgeDate.getDate() - CRAWLING_MAX_ARTICLE_AGE_DAYS);

    // Parse lastScrapedAt if provided
    const lastScrapedDate = lastScrapedAt ? new Date(lastScrapedAt) : null;

    for (const item of feed.items) {
      // Type assertion for RSS item (feed.items has proper RssItem type)
      const rssItem = item as RssItem;

      // Skip items without URLs
      if (!rssItem.link) {
        console.warn('RSS item missing link, skipping:', rssItem.title);
        continue;
      }

      // Parse published date
      let publishedDate: Date;
      if (rssItem.pubDate) {
        publishedDate = new Date(rssItem.pubDate);
      } else if (rssItem.isoDate) {
        publishedDate = new Date(rssItem.isoDate);
      } else {
        // If no date provided, skip article (we need dates for filtering)
        console.warn('RSS item missing date, skipping:', rssItem.link);
        continue;
      }

      // Validate date
      if (isNaN(publishedDate.getTime())) {
        console.warn('RSS item has invalid date, skipping:', rssItem.link);
        continue;
      }

      // Filter by max age (30 days)
      if (publishedDate < maxAgeDate) {
        continue; // Too old, skip
      }

      // Filter by last scraped date (if provided)
      if (lastScrapedDate && publishedDate <= lastScrapedDate) {
        continue; // Already processed in previous run, skip
      }

      // Extract article metadata
      articles.push({
        url: rssItem.link,
        title: rssItem.title || 'Untitled',
        author: rssItem.creator || undefined,
        publishedAt: publishedDate.toISOString(),
      });
    }

    return articles;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse RSS feed ${feedUrl}: ${errorMessage}`);
  }
}
