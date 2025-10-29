/**
 * URL normalization and hashing utilities
 * Used for deduplication of articles by URL
 */
import { createHash } from 'crypto';

/**
 * Normalize a URL for consistent comparison and hashing
 * - Strips query parameters
 * - Lowercases the hostname
 * - Removes trailing slash
 * - Removes fragment identifier
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // Lowercase the hostname
    urlObj.hostname = urlObj.hostname.toLowerCase();

    // Remove query parameters
    urlObj.search = '';

    // Remove fragment identifier
    urlObj.hash = '';

    // Get the normalized URL string
    let normalized = urlObj.toString();

    // Remove trailing slash (but keep it if it's the root path)
    if (normalized.endsWith('/') && urlObj.pathname !== '/') {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  } catch (error: unknown) {
    // If URL parsing fails, return the original URL
    // This allows the system to still process potentially malformed URLs
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Failed to normalize URL: ${url}`, errorMessage);
    return url;
  }
}

/**
 * Generate MD5 hash of a normalized URL
 * Used for fast deduplication checks in the database
 */
export function hashUrl(url: string): string {
  const normalized = normalizeUrl(url);
  return createHash('md5').update(normalized).digest('hex');
}
