/**
 * PromptFoo assertion: ranking quality of the retrieval step (evals/retrieval.yaml).
 *
 * Reads the rag-provider output `{ temporalWindowDays, urls }` and the test vars:
 *   expected_url  - article that must be retrieved in the top K (optional for negative tests)
 *   absent_url    - article that must NOT be retrieved at all, e.g. outside the recency window
 *   window_days   - expected recency window from temporal detection (optional)
 *
 * Named scores: hit_at_8 (1 if expected_url is in the top 8) and reciprocal_rank (1/rank, 0 if missing);
 * PromptFoo averages them across tests, which gives Hit@8 and MRR for the suite.
 */
import type { AssertionValueFunctionContext, GradingResult } from 'promptfoo';
import type { RetrievalOutput } from '../providers/rag-provider';

const K = 8;

export default function retrievalQuality(output: string, context: AssertionValueFunctionContext): GradingResult {
  const { urls, temporalWindowDays } = JSON.parse(output) as RetrievalOutput;
  const { expected_url: expectedUrl, absent_url: absentUrl, window_days: windowDays } = context.vars;
  const problems: string[] = [];
  const namedScores: Record<string, number> = {};

  if (windowDays !== undefined && Number(windowDays) !== temporalWindowDays) {
    problems.push(`recency window ${temporalWindowDays}d, expected ${windowDays}d`);
  }

  if (typeof expectedUrl === 'string') {
    const rank = urls.indexOf(expectedUrl) + 1;
    namedScores.hit_at_8 = rank > 0 && rank <= K ? 1 : 0;
    namedScores.reciprocal_rank = rank > 0 ? 1 / rank : 0;
    if (namedScores.hit_at_8 === 0) {
      problems.push(rank > 0 ? `expected article at rank ${rank} (> ${K})` : 'expected article not retrieved');
    }
  }

  if (typeof absentUrl === 'string' && urls.includes(absentUrl)) {
    problems.push(`out-of-window article retrieved at rank ${urls.indexOf(absentUrl) + 1}`);
  }

  return {
    pass: problems.length === 0,
    score: namedScores.reciprocal_rank ?? (problems.length === 0 ? 1 : 0),
    reason: problems.length === 0 ? `OK (${urls.length} articles retrieved)` : problems.join('; '),
    namedScores,
  };
}
