/**
 * /news: indexed articles, newest first. Loads the newest 1000 articles on the server
 * and hands them to the client list, which handles search and publisher filtering.
 */
import { type NewsArticle, NewsList } from '@/components/news/news-list';
import { getSupabaseClient } from '@/lib/server/supabase';

export const metadata = {
  title: 'Latest news - Crypto News Agent',
  description: 'Latest cryptocurrency news articles',
};

export const dynamic = 'force-dynamic';

const ARTICLE_LIMIT = 1000;

interface ArticlesResult {
  articles: NewsArticle[];
  /** Number of articles in the index, which can exceed the loaded ones */
  totalCount: number;
  failed: boolean;
}

async function getArticles(): Promise<ArticlesResult> {
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    return { articles: [], totalCount: 0, failed: true };
  }

  const { data, error, count } = await supabase
    .from('articles')
    .select(
      `
      id,
      title,
      url,
      text_summary,
      published_at,
      sources!inner (
        name
      )
    `,
      { count: 'exact' },
    )
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(ARTICLE_LIMIT);

  if (error) {
    console.error('Error fetching articles:', error);
    return { articles: [], totalCount: 0, failed: true };
  }

  // Transform the data to flatten the source name
  const articles = (data || []).map((article) => ({
    id: article.id,
    title: article.title,
    url: article.url,
    text_summary: article.text_summary,
    published_at: article.published_at,
    source_name: (article.sources as { name: string }).name,
  }));

  return { articles, totalCount: count ?? articles.length, failed: false };
}

export default async function NewsPage() {
  const { articles, totalCount, failed } = await getArticles();

  return <NewsList articles={articles} totalCount={totalCount} loadFailed={failed} />;
}
