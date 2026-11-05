import { describe, expect, it, vi } from 'vitest';
import { extractArticleIds, removeCitationMarkers } from './citations';

vi.mock('@/lib/server/supabase', () => ({ getSupabaseClient: vi.fn() }));

const ID_A = 'd4e05744-6804-47ee-b6d8-7780a1ffd4fb';
const ID_B = '0f1e2d3c-4b5a-4968-8776-5a4b3c2d1e0f';

describe('removeCitationMarkers', () => {
  it('removes all supported marker formats and the space before punctuation', () => {
    const text = `ETF inflows rose [Article ID: ${ID_A}]. Prices fell [1: ${ID_B}] and recovered [${ID_A}].`;
    expect(removeCitationMarkers(text)).toBe('ETF inflows rose. Prices fell and recovered.');
  });

  it('keeps markdown line breaks (paragraphs and lists)', () => {
    const text = `Summary [Article ID: ${ID_A}].\n\n- First point [Article ID: ${ID_B}]\n- Second point`;
    expect(removeCitationMarkers(text)).toBe('Summary.\n\n- First point\n- Second point');
  });
});

describe('extractArticleIds', () => {
  it('returns unique lowercase IDs', () => {
    const text = `A [Article ID: ${ID_A.toUpperCase()}] B [Article ID: ${ID_A}] C [${ID_B}]`;
    expect(extractArticleIds(text).sort()).toEqual([ID_A, ID_B].sort());
  });
});
