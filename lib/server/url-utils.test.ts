import { describe, expect, it } from 'vitest';
import { hashUrl, normalizeUrl } from './url-utils';

describe('normalizeUrl', () => {
  it('should lowercase the hostname', () => {
    const url = 'https://EXAMPLE.COM/path';
    const normalized = normalizeUrl(url);
    expect(normalized).toBe('https://example.com/path');
  });

  it('should remove query parameters', () => {
    const url = 'https://example.com/path?param=value&other=test';
    const normalized = normalizeUrl(url);
    expect(normalized).toBe('https://example.com/path');
  });

  it('should remove fragment identifier', () => {
    const url = 'https://example.com/path#section';
    const normalized = normalizeUrl(url);
    expect(normalized).toBe('https://example.com/path');
  });

  it('should remove trailing slash from paths', () => {
    const url = 'https://example.com/path/';
    const normalized = normalizeUrl(url);
    expect(normalized).toBe('https://example.com/path');
  });

  it('should keep trailing slash for root path', () => {
    const url = 'https://example.com/';
    const normalized = normalizeUrl(url);
    expect(normalized).toBe('https://example.com/');
  });

  it('should handle all normalizations together', () => {
    const url = 'https://EXAMPLE.COM/Path/?query=value#fragment';
    const normalized = normalizeUrl(url);
    expect(normalized).toBe('https://example.com/Path');
  });

  it('should return original URL if parsing fails', () => {
    const invalidUrl = 'not-a-valid-url';
    const normalized = normalizeUrl(invalidUrl);
    expect(normalized).toBe(invalidUrl);
  });

  it('should handle URLs with ports', () => {
    const url = 'https://example.com:8080/path?query=value';
    const normalized = normalizeUrl(url);
    expect(normalized).toBe('https://example.com:8080/path');
  });
});

describe('hashUrl', () => {
  it('should generate consistent MD5 hash for same URL', () => {
    const url = 'https://example.com/path';
    const hash1 = hashUrl(url);
    const hash2 = hashUrl(url);
    expect(hash1).toBe(hash2);
  });

  it('should generate same hash for URLs that normalize to same value', () => {
    const url1 = 'https://EXAMPLE.com/path?query=value#fragment';
    const url2 = 'https://example.com/path';
    const hash1 = hashUrl(url1);
    const hash2 = hashUrl(url2);
    expect(hash1).toBe(hash2);
  });

  it('should generate different hashes for different URLs', () => {
    const url1 = 'https://example.com/path1';
    const url2 = 'https://example.com/path2';
    const hash1 = hashUrl(url1);
    const hash2 = hashUrl(url2);
    expect(hash1).not.toBe(hash2);
  });

  it('should generate 32-character hex string (MD5)', () => {
    const url = 'https://example.com/path';
    const hash = hashUrl(url);
    expect(hash).toMatch(/^[a-f0-9]{32}$/);
    expect(hash.length).toBe(32);
  });
});
