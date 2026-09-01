import { ArticleCard } from './article-card';

interface ArticleWithSource {
  id: string;
  title: string | null;
  url: string;
  text_summary: string | null;
  published_at: string | null;
  source_name: string;
}

interface NewsListProps {
  articles: ArticleWithSource[];
}

export function NewsList({ articles }: NewsListProps) {
  return (
    <div className="mx-auto w-full max-w-[52.5rem] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <header className="mb-8">
        <p className="text-accent font-mono text-[11px] tracking-[0.22em]">INDEX</p>
        <h1 className="text-ink mt-2 text-[1.75rem] leading-tight font-medium tracking-tight sm:text-[2rem]">
          Latest from the wire
        </h1>
        <p className="text-faint mt-2 font-mono text-[11px] tracking-[0.12em]">
          {articles.length > 0 ? `${articles.length.toLocaleString('en-US')} ARTICLES` : 'NO ARTICLES AVAILABLE'}
        </p>
      </header>

      {articles.length === 0 ? (
        <p className="border-hairline text-muted border-t py-12 text-[15px]">
          No articles found. Run the ingestion process to fetch news articles.
        </p>
      ) : (
        <div className="divide-hairline border-hairline divide-y border-y">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              title={article.title}
              url={article.url}
              text_summary={article.text_summary}
              source_name={article.source_name}
              published_at={article.published_at}
            />
          ))}
        </div>
      )}
    </div>
  );
}
