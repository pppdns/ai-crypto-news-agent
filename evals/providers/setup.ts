/**
 * Shared setup for PromptFoo custom providers.
 * Loads `.env*` files the same way Next.js does and turns on Langfuse tracing with
 * `environment: eval`, so eval runs show up in Langfuse separately from production traffic.
 */
import { loadEnv } from '../../lib/server/load-env';
import { registerStandaloneTracing } from '../../lib/server/tracing';

let initialized = false;

export function setupEvalRuntime(): void {
  if (initialized) {
    return;
  }
  loadEnv();
  process.env.LANGFUSE_TRACING_ENVIRONMENT ??= 'eval';
  registerStandaloneTracing();
  initialized = true;
}
