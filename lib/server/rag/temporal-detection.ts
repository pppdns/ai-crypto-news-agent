/**
 * Temporal keyword detection for smart recency filtering
 * Detects time-related keywords and returns appropriate recency window in days
 */
import { TemporalWindow } from './types';

/**
 * Temporal keyword patterns and their corresponding day windows
 */
const TEMPORAL_PATTERNS: Array<{ pattern: RegExp; days: number; keyword: string }> = [
  // Very recent (1-3 days)
  { pattern: /\b(today|right now)\b/i, days: 1, keyword: 'today' },
  { pattern: /\b(yesterday|past (day|24 hours))\b/i, days: 2, keyword: 'yesterday' },
  { pattern: /\b(most recent|breaking|just (now|in))\b/i, days: 3, keyword: 'latest' },

  // This week (7 days)
  { pattern: /\b(latest|this week|past week|last 7 days|current)\b/i, days: 7, keyword: 'this week' },

  // Recent (14 days)
  { pattern: /\b(recent(ly)?|past (two weeks|2 weeks|fortnight))\b/i, days: 14, keyword: 'recent' },

  // This month (30 days)
  { pattern: /\b(this month|past month|last 30 days)\b/i, days: 30, keyword: 'this month' },
];

/**
 * Default recency window when no temporal keywords detected
 * Uses 21 days as a balance between freshness and coverage
 */
const DEFAULT_WINDOW_DAYS = 21;

/**
 * Detect temporal keywords in query and determine recency window
 *
 * @param query - User query text
 * @returns Temporal window with days, detected flag, and matched keyword
 *
 * @example
 * ```typescript
 * detectTemporalWindow("What happened with Bitcoin today?")
 * // Returns: { days: 1, detected: true, keyword: 'today' }
 *
 * detectTemporalWindow("Tell me about Ethereum")
 * // Returns: { days: 21, detected: false }
 * ```
 */
export function detectTemporalWindow(query: string): TemporalWindow {
  if (!query || query.trim().length === 0) {
    return { days: DEFAULT_WINDOW_DAYS, detected: false };
  }

  // Check each pattern in order (most specific first)
  for (const { pattern, days, keyword } of TEMPORAL_PATTERNS) {
    if (pattern.test(query)) {
      return { days, detected: true, keyword };
    }
  }

  // No temporal keyword found, use default
  return { days: DEFAULT_WINDOW_DAYS, detected: false };
}
