/**
 * PromptFoo `transformVars` hook for evals/generation.yaml.
 * Adds `context` (plain text of the fixture articles) so model-graded assertions such as
 * `context-faithfulness` can see exactly what the answer model saw.
 */
import { buildContextChunks, contextAsText } from './contexts';

interface GenerationVars {
  query: string;
  articles?: string[];
  inject?: string;
  [key: string]: unknown;
}

export default function transformVars(vars: GenerationVars): GenerationVars & { context: string } {
  const chunks = buildContextChunks(vars.articles ?? [], { inject: vars.inject });
  return { ...vars, context: contextAsText(chunks) };
}
