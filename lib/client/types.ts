/**
 * Types shared between browser code and the API responses it consumes.
 * `IndexStats` is produced by lib/server/index-stats.ts.
 * `Citation` mirrors `Citation` in lib/server/rag/types.ts (the shape /ask sends).
 */

export interface Citation {
  url: string;
  title: string;
  sourceName: string;
  relativeDate: string;
  articleId: string;
}

export interface LatestHeadline {
  id: string;
  title: string;
  url: string;
  sourceName: string;
  publishedAt: string | null;
}

export interface IndexStats {
  articleCount: number;
  sourceCount: number;
  /** ISO timestamp of the oldest article in the index, if any */
  oldestPublishedAt: string | null;
  latest: LatestHeadline[];
}
