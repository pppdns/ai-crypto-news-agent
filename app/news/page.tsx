import { NewsList } from '@/components/news/news-list';
import { getSupabaseClient } from '@/lib/server/supabase';

export const metadata = {
  title: 'News - AI Crypto News Agent',
  description: 'Latest cryptocurrency news articles',
};

interface ArticleWithSource {
  id: string;
  title: string | null;
  url: string;
  text_summary: string | null;
  published_at: string | null;
  source_name: string;
}

async function getArticles(): Promise<ArticleWithSource[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
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
    )
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(1000);

  if (error) {
    console.error('Error fetching articles:', error);
    return [];
  }

  // Transform the data to flatten the source name
  return (data || []).map((article) => ({
    id: article.id,
    title: article.title,
    url: article.url,
    text_summary: article.text_summary,
    published_at: article.published_at,
    source_name: (article.sources as { name: string }).name,
  }));
}

export default async function NewsPage() {
  const articles = await getArticles();

  return (
    <div className="min-h-screen bg-slate-100 p-4 pb-12 sm:p-8">
      <NewsList articles={articles} />
    </div>
  );
}
