/**
 * PromptFoo assertion: citation integrity of a generated answer (evals/generation.yaml).
 *
 * Checks, in order:
 * 1. At least one `[Article ID: <uuid>]` citation (unless the answer is exactly "No recent news").
 * 2. Every cited ID exists in the context the model was given (no invented sources).
 * 3. Every content paragraph / list item carries a citation ("cite every claim").
 *
 * Score = share of content paragraphs that are cited; pass requires all three checks.
 */
import type { AssertionValueFunctionContext, GradingResult } from 'promptfoo';
import { NO_RECENT_NEWS } from '../../lib/server/rag/answer';
import { buildContextChunks } from '../fixtures/contexts';

const CITATION = /\[Article ID:\s*([0-9a-f-]{36})\]/gi;
/** Paragraphs shorter than this (headings, "Summary:" lines) are not treated as claims. */
const MIN_CLAIM_LENGTH = 40;

function contentParagraphs(text: string): string[] {
  return text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length >= MIN_CLAIM_LENGTH && !p.startsWith('#'));
}

export default function citationIntegrity(output: string, context: AssertionValueFunctionContext): GradingResult {
  const answer = output.trim();
  if (answer === NO_RECENT_NEWS) {
    return { pass: true, score: 1, reason: 'Answer is "No recent news"; nothing to cite' };
  }

  const vars = context.vars;
  const articles = Array.isArray(vars.articles) ? vars.articles.map(String) : [];
  const inject = typeof vars.inject === 'string' ? vars.inject : undefined;
  const allowedIds = new Set(buildContextChunks(articles, { inject }).map((c) => c.article_id));

  const citedIds = [...answer.matchAll(CITATION)].map((m) => m[1].toLowerCase());
  if (citedIds.length === 0) {
    return { pass: false, score: 0, reason: 'No [Article ID: ...] citations found' };
  }

  const unknownIds = [...new Set(citedIds.filter((id) => !allowedIds.has(id)))];
  if (unknownIds.length > 0) {
    return { pass: false, score: 0, reason: `Cites IDs that are not in the context: ${unknownIds.join(', ')}` };
  }

  const paragraphs = contentParagraphs(answer);
  const uncited = paragraphs.filter((p) => !new RegExp(CITATION.source, 'i').test(p));
  const score = paragraphs.length === 0 ? 1 : (paragraphs.length - uncited.length) / paragraphs.length;

  return {
    pass: uncited.length === 0,
    score,
    reason:
      uncited.length === 0
        ? `${citedIds.length} citations, all from context; every paragraph cited`
        : `${uncited.length}/${paragraphs.length} paragraphs have no citation, e.g. "${uncited[0].slice(0, 80)}..."`,
    namedScores: { citation_coverage: score },
  };
}
