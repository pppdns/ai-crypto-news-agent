import { describe, expect, it } from 'vitest';
import { formatRelativeTime, formatShortDate } from './relative-time';

const now = new Date('2026-11-06T12:00:00Z');

describe('formatRelativeTime', () => {
  it('returns "just now" for under a minute and for future dates', () => {
    expect(formatRelativeTime('2026-11-06T11:59:30Z', { now })).toBe('just now');
    expect(formatRelativeTime('2026-11-06T12:05:00Z', { now })).toBe('just now');
  });

  it('formats minutes, hours and days', () => {
    expect(formatRelativeTime('2026-11-06T11:48:00Z', { now })).toBe('12m ago');
    expect(formatRelativeTime('2026-11-06T07:00:00Z', { now })).toBe('5h ago');
    expect(formatRelativeTime('2026-11-03T12:00:00Z', { now })).toBe('3d ago');
  });

  it('falls back to a short date after 30 days', () => {
    expect(formatRelativeTime('2026-09-01T12:00:00Z', { now })).toBe('Sep 1, 2026');
  });

  it('handles invalid input', () => {
    expect(formatRelativeTime('not a date', { now })).toBe('Unknown date');
  });
});

describe('formatShortDate', () => {
  it('formats as "Mon D, YYYY"', () => {
    expect(formatShortDate('2025-10-29T12:00:00Z')).toBe('Oct 29, 2025');
  });
});
