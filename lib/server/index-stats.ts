/**
 * Read-only stats about the article index, shown in the UI (header count, home page).
 *
 * Usage (server components only):
 *   const stats = await getIndexStats();
 *
 * Never throws: if Supabase is unreachable or misconfigured it logs and returns `null`,
 * so pages can still render without the stats.
 */
import type { IndexStats } from '@/lib/client/types';
import { getSupabaseClient } from '@/lib/server/supabase';

export type { IndexStats };

export async function getIndexStats(latestLimit = 4): Promise<IndexStats | null> {
  try {
    const supabase = getSupabaseClient();

    const [countResult, sourcesResult, oldestResult, latestResult] = await Promise.all([
      supabase.from('articles').select('*', { count: 'exact', head: true }),
      // Every configured publisher feed, whether or not it has articles yet
      supabase.from('sources').select('*', { count: 'exact', head: true }),
      supabase
        .from('articles')
        .select('published_at')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: true })
        .limit(1),
      supabase
        .from('articles')
        .select('id, title, url, published_at, sources!inner (name)')
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(latestLimit),
    ]);

    const firstError = countResult.error ?? sourcesResult.error ?? oldestResult.error ?? latestResult.error;
    if (firstError) {
      console.error('Error fetching index stats:', firstError);
      return null;
    }

    return {
      articleCount: countResult.count ?? 0,
      sourceCount: sourcesResult.count ?? 0,
      oldestPublishedAt: oldestResult.data?.[0]?.published_at ?? null,
      latest: (latestResult.data ?? []).map((article) => ({
        id: article.id,
        title: article.title || 'Untitled',
        url: article.url,
        sourceName: (article.sources as { name: string }).name,
        publishedAt: article.published_at,
      })),
    };
  } catch (error) {
    console.error('Unexpected error fetching index stats:', error);
    return null;
  }
}
