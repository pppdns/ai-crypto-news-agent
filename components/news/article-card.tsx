interface ArticleCardProps {
  title: string | null;
  url: string;
  text_summary: string | null;
  source_name: string;
  published_at: string | null;
}

function formatRailDate(dateString: string): string {
  const past = new Date(dateString);
  if (Number.isNaN(past.getTime())) {
    return '—';
  }

  const now = new Date();
  const day = past.getDate().toString().padStart(2, '0');
  const month = past.toLocaleString('en-US', { month: 'short' }).toUpperCase();

  if (past.getFullYear() !== now.getFullYear()) {
    return `${day} ${month} ${past.getFullYear()}`;
  }

  return `${day} ${month}`;
}

export function ArticleCard({ title, url, text_summary, source_name, published_at }: ArticleCardProps) {
  const railDate = published_at ? formatRailDate(published_at) : '—';

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group grid items-start gap-2 py-5 md:grid-cols-[9.5rem_minmax(0,1fr)] md:gap-6"
    >
      <div className="font-mono text-[11px] tracking-[0.08em]">
        <div className="text-faint">{railDate}</div>
        <div className="text-muted mt-1 uppercase">{source_name}</div>
      </div>
      <div className="min-w-0">
        <h2 className="text-ink group-hover:text-accent text-[16px] leading-snug font-medium tracking-tight transition-colors">
          {title || 'Untitled'}
        </h2>
        <p className="text-muted mt-1.5 line-clamp-2 text-[14px] leading-relaxed">
          {text_summary || 'No summary available'}
        </p>
      </div>
    </a>
  );
}
