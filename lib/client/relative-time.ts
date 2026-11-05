/**
 * Formats timestamps for display in the UI.
 *
 * Usage:
 *   formatRelativeTime('2026-11-06T10:00:00Z')        // "3h ago"
 *   formatRelativeTime(date, { now: someOtherDate })  // deterministic, for tests
 *   formatShortDate('2025-10-29T00:00:00Z')           // "Oct 29, 2025" (UTC, so server and client agree)
 */

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatShortDate(value: string | Date): string {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Compact relative time: "just now", "12m ago", "5h ago", "3d ago", then a short date after 30 days.
 * Future timestamps (clock skew) are treated as "just now".
 */
export function formatRelativeTime(value: string | Date, { now = new Date() }: { now?: Date } = {}): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';

  const diff = now.getTime() - date.getTime();
  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 30 * DAY) return `${Math.floor(diff / DAY)}d ago`;
  return formatShortDate(date);
}
