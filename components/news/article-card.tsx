import { Card, CardBody, CardHeader, Link } from '@heroui/react';
import { ExternalLink } from 'lucide-react';

interface ArticleCardProps {
  title: string | null;
  url: string;
  text_summary: string | null;
  source_name: string;
  published_at: string | null;
}

function getRelativeTime(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else {
    // Fall back to formatted date for older articles
    return past.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}

export function ArticleCard({ title, url, text_summary, source_name, published_at }: ArticleCardProps) {
  // Format as relative time (e.g., "2 hours ago", "3 days ago")
  const formattedDateTime = published_at ? getRelativeTime(published_at) : 'Unknown date';

  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader className="flex-col items-start gap-2 pb-2">
        <Link
          href={url}
          isExternal
          showAnchorIcon
          className="text-lg font-semibold text-slate-800"
          anchorIcon={<ExternalLink className="h-4 w-4" />}
        >
          {title || 'Untitled'}
        </Link>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="text-primary font-medium">{source_name}</span>
          <span>•</span>
          <span>{formattedDateTime}</span>
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        <p className="line-clamp-4 text-sm text-slate-600">{text_summary || 'No summary available'}</p>
      </CardBody>
    </Card>
  );
}
