import { describe, expect, it } from 'vitest';
import { getAskErrorMessage, hideCitationMarkers, parseAskStream } from './ask-stream';

const citation = {
  url: 'https://example.com/a',
  title: 'Solana ETF approved',
  sourceName: 'Cointelegraph',
  relativeDate: 'Today',
  articleId: 'd4e05744-6804-47ee-b6d8-7780a1ffd4fb',
};

describe('parseAskStream', () => {
  it('returns plain streamed text as the answer, keeping newlines', () => {
    expect(parseAskStream('First paragraph.\n\n- item one\n- item two')).toEqual({
      answer: 'First paragraph.\n\n- item one\n- item two',
      citations: null,
      error: null,
    });
  });

  it('replaces the answer with cleanedText and reads citations', () => {
    const raw =
      'Raw [Article ID: d4e05744-6804-47ee-b6d8-7780a1ffd4fb]' +
      `\ndata: ${JSON.stringify({ type: 'cleanedText', text: 'Clean answer.' })}\n\n` +
      `\ndata: ${JSON.stringify({ type: 'citations', citations: [citation] })}\n\n`;

    expect(parseAskStream(raw)).toEqual({ answer: 'Clean answer.', citations: [citation], error: null });
  });

  it('ignores an incomplete trailing event while streaming', () => {
    const raw = 'Answer text\ndata: {"type":"cleanedText","te';
    expect(parseAskStream(raw)).toEqual({ answer: 'Answer text', citations: null, error: null });
  });

  it('surfaces error events', () => {
    const raw = `Partial\ndata: ${JSON.stringify({ type: 'error', message: 'Model timed out' })}\n\n`;
    expect(parseAskStream(raw)).toMatchObject({ answer: 'Partial', error: 'Model timed out' });
  });

  it('ignores events with an unexpected shape', () => {
    const raw = `Answer\ndata: ${JSON.stringify({ type: 'citations', citations: 'nope' })}\n\n`;
    expect(parseAskStream(raw).citations).toBeNull();
  });
});

describe('getAskErrorMessage', () => {
  it('prefers message, then error, from a JSON body', () => {
    expect(getAskErrorMessage('{"error":"Failed","message":"DB down"}', 500)).toBe('DB down');
    expect(getAskErrorMessage('{"error":"Failed"}', 500)).toBe('Failed');
  });

  it('falls back to the text body or the status', () => {
    expect(getAskErrorMessage('No user query provided', 400)).toBe('No user query provided');
    expect(getAskErrorMessage('', 502)).toBe('Request failed with status 502');
  });
});

describe('hideCitationMarkers', () => {
  const id = 'd4e05744-6804-47ee-b6d8-7780a1ffd4fb';

  it('removes complete markers along with the space before them', () => {
    expect(hideCitationMarkers(`Inflows rose [Article ID: ${id}], then fell [1: ${id}]. Done [${id}].`)).toBe(
      'Inflows rose, then fell. Done.',
    );
  });

  it('hides a marker that is still streaming in', () => {
    expect(hideCitationMarkers('Inflows rose [Article ID: d4e05')).toBe('Inflows rose');
    expect(hideCitationMarkers('Inflows rose [Art')).toBe('Inflows rose');
    expect(hideCitationMarkers('Inflows rose [')).toBe('Inflows rose');
    expect(hideCitationMarkers('Inflows rose [d4e05744-68')).toBe('Inflows rose');
  });

  it('keeps other bracketed text', () => {
    expect(hideCitationMarkers('See [the filing](https://sec.gov)')).toBe('See [the filing](https://sec.gov)');
    expect(hideCitationMarkers('Layer 2s [like Base')).toBe('Layer 2s [like Base');
  });

  it('is applied to the streamed answer', () => {
    expect(parseAskStream(`Inflows rose [Article ID: ${id}] sharply [Article ID: d4`).answer).toBe(
      'Inflows rose sharply',
    );
  });
});
