-- Add last_scraped_at column to sources table
-- This tracks when each source was last crawled for incremental ingestion

ALTER TABLE sources ADD COLUMN last_scraped_at timestamptz;

COMMENT ON COLUMN sources.last_scraped_at IS 'Timestamp of the last successful crawl - used for incremental RSS feed processing. NULL = never scraped.';

