/**
 * Citation parsing and enrichment
 * Extracts article IDs from LLM response and enriches with metadata
 */
import { getSupabaseClient } from '@/lib/server/supabase';
import { Citation } from './types';

/**
 * UUID regex pattern for matching article IDs
 */
const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/**
 * Citation marker pattern: [Article ID: <uuid>]
 */
const CITATION_PATTERN = /\[Article ID:\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\]/gi;

/**
 * Convert timestamp to relative date string
 *
 * @param dateString - ISO date string
 * @returns Relative date (e.g., "2 days ago")
 */
function getRelativeDate(dateString: string | null): string {
  if (!dateString) {
    return 'Unknown date';
  }

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return months === 1 ? '1 month ago' : `${months} months ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return years === 1 ? '1 year ago' : `${years} years ago`;
    }
  } catch (error) {
    console.error('Error parsing date:', error);
    return 'Unknown date';
  }
}

/**
 * Extract article IDs from LLM response
 *
 * @param text - LLM response text containing citation markers
 * @returns Array of unique article IDs
 */
export function extractArticleIds(text: string): string[] {
  const ids = new Set<string>();

  // Match citation markers
  let match;
  while ((match = CITATION_PATTERN.exec(text)) !== null) {
    ids.add(match[1].toLowerCase());
  }

  // Also match standalone UUIDs as fallback
  CITATION_PATTERN.lastIndex = 0;
  UUID_PATTERN.lastIndex = 0;

  while ((match = UUID_PATTERN.exec(text)) !== null) {
    ids.add(match[0].toLowerCase());
  }

  // Reset regex state
  CITATION_PATTERN.lastIndex = 0;
  UUID_PATTERN.lastIndex = 0;

  // TODO: Use a Set instead?
  return Array.from(ids);
}

/**
 * Article with joined source data from Supabase query
 */
interface ArticleWithSource {
  id: string;
  title: string | null;
  url: string;
  published_at: string | null;
  source: { name: string } | null;
}

/**
 * Fetch article metadata from database
 *
 * @param articleIds - Array of article IDs
 * @returns Map of article ID to metadata
 */
async function fetchArticleMetadata(articleIds: string[]): Promise<
  Map<
    string,
    {
      title: string;
      url: string;
      source_name: string;
      published_at: string | null;
    }
  >
> {
  if (articleIds.length === 0) {
    return new Map();
  }

  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('articles')
      .select(
        `
        id,
        title,
        url,
        published_at,
        source:sources(name)
      `,
      )
      .in('id', articleIds);

    if (error) {
      console.error('Error fetching article metadata:', error);
      return new Map();
    }

    const metadataMap = new Map();

    if (data) {
      for (const article of data as ArticleWithSource[]) {
        metadataMap.set(article.id, {
          title: article.title || 'Untitled',
          url: article.url,
          source_name: article.source?.name || 'Unknown Source',
          published_at: article.published_at,
        });
      }
    }

    return metadataMap;
  } catch (error) {
    console.error('Error in fetchArticleMetadata:', error);
    return new Map();
  }
}

/**
 * Parse citations from LLM response and enrich with metadata
 *
 * @param text - LLM response text
 * @returns Object with cleaned text and enriched citations
 */
export async function parseCitations(text: string): Promise<{
  text: string;
  citations: Citation[];
}> {
  // Extract article IDs
  const articleIds = extractArticleIds(text);

  if (articleIds.length === 0) {
    return { text, citations: [] };
  }

  // Fetch metadata for all cited articles
  const metadataMap = await fetchArticleMetadata(articleIds);

  // Build citations array (deduplicated by URL)
  const citationsMap = new Map<string, Citation>();

  for (const articleId of articleIds) {
    const metadata = metadataMap.get(articleId);
    if (metadata) {
      // Use URL as key to deduplicate
      if (!citationsMap.has(metadata.url)) {
        citationsMap.set(metadata.url, {
          url: metadata.url,
          title: metadata.title,
          sourceName: metadata.source_name,
          relativeDate: getRelativeDate(metadata.published_at),
          articleId,
        });
      }
    }
  }

  const citations = Array.from(citationsMap.values());

  console.log(`Parsed ${citations.length} citations from response`);

  return { text, citations };
}
