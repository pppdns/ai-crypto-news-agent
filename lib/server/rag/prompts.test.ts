import { describe, expect, it } from 'vitest';
import { getAnswerPrompt, getRerankPrompt } from './prompts';
import { Chunk } from './types';

describe('getAnswerPrompt', () => {
  const createMockChunk = (overrides?: Partial<Chunk>): Chunk => ({
    id: 'chunk-123',
    article_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    content: 'Bitcoin reached a new all-time high today.',
    title: 'Bitcoin Hits New Record',
    source_name: 'CryptoNews',
    published_at: '2024-01-15T10:30:00Z',
    url: 'https://example.com/bitcoin-ath',
    ...overrides,
  });

  it('should generate prompt with single chunk', () => {
    const query = 'What happened with Bitcoin?';
    const chunks = [createMockChunk()];

    const prompt = getAnswerPrompt(query, chunks);

    // Should include system instructions
    expect(prompt).toContain('You are a helpful crypto news assistant');
    expect(prompt).toContain('STRICT RULES');

    // Should include context with chunk content
    expect(prompt).toContain('Bitcoin reached a new all-time high today');
    expect(prompt).toContain('[1] Article ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890');
    expect(prompt).toContain('Title: Bitcoin Hits New Record');
    expect(prompt).toContain('Source: CryptoNews');

    // Should include user query
    expect(prompt).toContain('User Question: What happened with Bitcoin?');
  });

  it('should generate prompt with multiple chunks', () => {
    const query = 'Tell me about crypto news';
    const chunks = [
      createMockChunk({
        article_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        content: 'First article content',
        title: 'First Article',
      }),
      createMockChunk({
        article_id: 'ffffffff-1111-2222-3333-444444444444',
        content: 'Second article content',
        title: 'Second Article',
      }),
      createMockChunk({
        article_id: '99999999-8888-7777-6666-555555555555',
        content: 'Third article content',
        title: 'Third Article',
      }),
    ];

    const prompt = getAnswerPrompt(query, chunks);

    // Should include all chunks with correct numbering
    expect(prompt).toContain('[1] Article ID: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
    expect(prompt).toContain('[2] Article ID: ffffffff-1111-2222-3333-444444444444');
    expect(prompt).toContain('[3] Article ID: 99999999-8888-7777-6666-555555555555');

    // Should include all content
    expect(prompt).toContain('First article content');
    expect(prompt).toContain('Second article content');
    expect(prompt).toContain('Third article content');

    // Should separate chunks with separator
    expect(prompt).toContain('---');
  });

  it('should handle chunks with null title', () => {
    const chunks = [
      createMockChunk({
        title: null,
      }),
    ];

    const prompt = getAnswerPrompt('test query', chunks);

    expect(prompt).toContain('Title: Untitled');
  });

  it('should handle chunks with null source_name', () => {
    const chunks = [
      createMockChunk({
        source_name: null,
      }),
    ];

    const prompt = getAnswerPrompt('test query', chunks);

    expect(prompt).toContain('Source: Unknown');
  });

  it('should handle chunks with null published_at', () => {
    const chunks = [
      createMockChunk({
        published_at: null,
      }),
    ];

    const prompt = getAnswerPrompt('test query', chunks);

    expect(prompt).toContain('Date: Unknown');
  });

  it('should format published_at date correctly', () => {
    const chunks = [
      createMockChunk({
        published_at: '2024-03-15T14:30:00Z',
      }),
    ];

    const prompt = getAnswerPrompt('test query', chunks);

    // Date format will vary by locale, but should be present and valid
    expect(prompt).toMatch(/Date: \d{1,2}\/\d{1,2}\/\d{4}/);
  });

  it('should include citation format instruction with UUID format', () => {
    const chunks = [createMockChunk()];

    const prompt = getAnswerPrompt('test query', chunks);

    expect(prompt).toContain('[Article ID: <uuid>]');
    expect(prompt).toContain('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
  });

  it('should include "No recent news" instruction', () => {
    const chunks = [createMockChunk()];

    const prompt = getAnswerPrompt('test query', chunks);

    expect(prompt).toContain('No recent news');
    expect(prompt).toContain("doesn't contain enough information to answer the question");
  });

  it('should include anti-hallucination rules', () => {
    const chunks = [createMockChunk()];

    const prompt = getAnswerPrompt('test query', chunks);

    expect(prompt).toContain('Only use information from the context provided');
    expect(prompt).toContain('Do not fabricate or hallucinate any information');
  });

  it('should include offensive content handling', () => {
    const chunks = [createMockChunk()];

    const prompt = getAnswerPrompt('test query', chunks);

    expect(prompt).toContain('offensive or inappropriate');
  });

  it('should handle empty chunks array', () => {
    const prompt = getAnswerPrompt('test query', []);

    // Should still generate valid prompt structure
    expect(prompt).toContain('You are a helpful crypto news assistant');
    expect(prompt).toContain('Context:');
    expect(prompt).toContain('User Question: test query');

    // Context should be empty
    const contextSection = prompt.match(/Context:\n([\s\S]*?)\n\nUser Question:/);
    expect(contextSection).toBeTruthy();
    expect(contextSection![1].trim()).toBe('');
  });

  it('should escape special characters in query', () => {
    const query = 'What about "Bitcoin" & <Ethereum>?';
    const chunks = [createMockChunk()];

    const prompt = getAnswerPrompt(query, chunks);

    expect(prompt).toContain('User Question: What about "Bitcoin" & <Ethereum>?');
  });

  it('should handle very long content', () => {
    const longContent = 'A'.repeat(5000);
    const chunks = [
      createMockChunk({
        content: longContent,
      }),
    ];

    const prompt = getAnswerPrompt('test query', chunks);

    expect(prompt).toContain(longContent);
    expect(prompt.length).toBeGreaterThan(5000);
  });

  it('should include conciseness instruction', () => {
    const chunks = [createMockChunk()];

    const prompt = getAnswerPrompt('test query', chunks);

    expect(prompt).toContain('Be concise and factual');
  });
});

describe('getRerankPrompt', () => {
  const createMockChunk = (overrides?: Partial<Chunk>): Chunk => ({
    id: 'chunk-123',
    article_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    content: 'Ethereum 2.0 upgrade is progressing well.',
    title: 'Ethereum 2.0 Progress',
    source_name: 'CryptoNews',
    published_at: '2024-01-15T10:30:00Z',
    url: 'https://example.com/eth2',
    ...overrides,
  });

  it('should generate rerank prompt with chunk content', () => {
    const query = 'What is happening with Ethereum?';
    const chunk = createMockChunk();

    const prompt = getRerankPrompt(query, chunk);

    // Should include scoring instructions
    expect(prompt).toContain('Score the relevance');
    expect(prompt).toContain('scale of 1-10');

    // Should include query
    expect(prompt).toContain('Query: What is happening with Ethereum?');

    // Should include chunk content
    expect(prompt).toContain('Title: Ethereum 2.0 Progress');
    expect(prompt).toContain('Content: Ethereum 2.0 upgrade is progressing well');

    // Should request only number response
    expect(prompt).toContain('ONLY a single number between 1 and 10');
    expect(prompt).toContain('No explanation needed');
  });

  it('should include relevance scale explanation', () => {
    const chunk = createMockChunk();

    const prompt = getRerankPrompt('test query', chunk);

    expect(prompt).toContain('1-3: Not relevant or off-topic');
    expect(prompt).toContain('4-6: Somewhat relevant');
    expect(prompt).toContain('7-8: Relevant, contains useful information');
    expect(prompt).toContain('9-10: Highly relevant, directly answers the query');
  });

  it('should handle chunk with null title', () => {
    const chunk = createMockChunk({
      title: null,
    });

    const prompt = getRerankPrompt('test query', chunk);

    expect(prompt).toContain('Title: Untitled');
  });

  it('should handle empty content', () => {
    const chunk = createMockChunk({
      content: '',
    });

    const prompt = getRerankPrompt('test query', chunk);

    expect(prompt).toContain('Content: ');
    // Should still have valid prompt structure
    expect(prompt).toContain('Query: test query');
  });

  it('should handle special characters in query', () => {
    const query = 'What about "DeFi" & <NFTs>?';
    const chunk = createMockChunk();

    const prompt = getRerankPrompt(query, chunk);

    expect(prompt).toContain('Query: What about "DeFi" & <NFTs>?');
  });

  it('should handle special characters in content', () => {
    const chunk = createMockChunk({
      content: 'Bitcoin jumped 10% & reached $50k!',
    });

    const prompt = getRerankPrompt('test query', chunk);

    expect(prompt).toContain('Content: Bitcoin jumped 10% & reached $50k!');
  });

  it('should handle very long content', () => {
    const longContent = 'Long article content. '.repeat(200);
    const chunk = createMockChunk({
      content: longContent,
    });

    const prompt = getRerankPrompt('test query', chunk);

    expect(prompt).toContain(longContent);
  });

  it('should handle unicode characters', () => {
    const chunk = createMockChunk({
      title: 'Bitcoin 比特币 Reaches New High',
      content: 'The price increased by 5% 📈',
    });

    const prompt = getRerankPrompt('bitcoin news', chunk);

    expect(prompt).toContain('Bitcoin 比特币 Reaches New High');
    expect(prompt).toContain('The price increased by 5% 📈');
  });

  it('should format prompt with clear sections', () => {
    const chunk = createMockChunk();

    const prompt = getRerankPrompt('test query', chunk);

    // Should have clear section markers
    expect(prompt).toContain('Query:');
    expect(prompt).toContain('Article Chunk:');
    expect(prompt).toContain('Score:');
  });

  it('should end with Score: prompt', () => {
    const chunk = createMockChunk();

    const prompt = getRerankPrompt('test query', chunk);

    expect(prompt.trim().endsWith('Score:')).toBe(true);
  });
});
