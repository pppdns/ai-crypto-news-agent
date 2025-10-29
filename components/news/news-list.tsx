'use client';

import Link from 'next/link';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { MessageSquare } from 'lucide-react';
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
    <div className="mx-auto max-w-7xl">
      <Card className="mb-6 p-6">
        <CardHeader className="flex-row items-start justify-between pb-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">Latest Crypto News</h1>
            <p className="text-sm text-slate-600">
              {articles.length > 0
                ? `Showing ${articles.length} recent article${articles.length !== 1 ? 's' : ''}`
                : 'No articles available'}
            </p>
          </div>
          <Button
            as={Link}
            href="/"
            variant="flat"
            color="primary"
            startContent={<MessageSquare className="h-4 w-4 shrink-0" />}
            className="shrink-0"
          >
            Chat
          </Button>
        </CardHeader>
      </Card>

      {articles.length === 0 ? (
        <Card className="p-12 text-center">
          <CardBody>
            <p className="text-lg text-slate-600">
              No articles found. Run the ingestion process to fetch news articles.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
