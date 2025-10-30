/**
 * Firecrawl integration for article content extraction
 * Uses Firecrawl's LLM-powered summarization to extract clean article text
 */
import Firecrawl, { type Document as FirecrawlDocument } from '@mendable/firecrawl-js';

/**
 * Initialize Firecrawl client
 * Requires FIRECRAWL_API_KEY environment variable
 */
function getFirecrawlClient(): Firecrawl {
  const apiKey = process.env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY environment variable is required');
  }

  return new Firecrawl({ apiKey });
}

/**
 * Scrape an article URL and extract its summary text
 * Uses Firecrawl's 'summary' format for LLM-generated clean text
 *
 * @param url - URL of the article to scrape
 * @returns Extracted summary text from the article
 * @throws Error if scraping fails or no summary is returned
 */
export async function scrapeArticle(url: string): Promise<string> {
  const firecrawl = getFirecrawlClient();

  try {
    // Scrape with summary format - returns a Document with optional summary field
    const result: FirecrawlDocument = await firecrawl.scrape(url, {
      formats: ['summary'],
    });

    // Extract and validate summary text
    const summary = result.summary;

    if (!summary || typeof summary !== 'string' || summary.trim().length === 0) {
      throw new Error('No summary text returned from Firecrawl');
    }

    return summary.trim();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to scrape article ${url}: ${errorMessage}`);
  }
}
