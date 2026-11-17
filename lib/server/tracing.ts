/**
 * LLM tracing with Langfuse (OpenTelemetry based).
 *
 * The `/ask` request, every LangGraph node, the reranker's OpenAI calls and the AI SDK answer generation
 * are recorded as one nested Langfuse trace. See docs/tracing.md.
 *
 * Wiring:
 * - Sentry owns the global OpenTelemetry provider when it is enabled (production), so
 *   `sentry.server.config.ts` adds `getLangfuseSpanProcessor()` to Sentry's span processors.
 * - When Sentry is disabled (dev, tests, eval runs), `registerStandaloneTracing()` registers a plain
 *   NodeTracerProvider with the Langfuse processor.
 * - Without `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` tracing is a no-op; the app runs unchanged.
 *
 * Call `flushTraces()` before a short-lived process (serverless function, CLI script) exits.
 */
import { LangfuseSpanProcessor, isDefaultExportSpan } from '@langfuse/otel';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';

let spanProcessor: LangfuseSpanProcessor | null | undefined;

/** True when Langfuse credentials are present. */
export function isTracingEnabled(): boolean {
  return Boolean(process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY);
}

/**
 * Shared Langfuse span processor, or null when tracing is not configured.
 * Uses immediate export on Vercel (serverless), batched export elsewhere.
 */
export function getLangfuseSpanProcessor(): LangfuseSpanProcessor | null {
  if (spanProcessor !== undefined) {
    return spanProcessor;
  }

  spanProcessor = isTracingEnabled()
    ? new LangfuseSpanProcessor({
        exportMode: process.env.VERCEL ? 'immediate' : 'batched',
        // Default LLM-span filter, minus PromptFoo's own judge/grader calls during eval runs
        shouldExportSpan: ({ otelSpan }) =>
          isDefaultExportSpan(otelSpan) && !otelSpan.instrumentationScope.name.startsWith('promptfoo'),
        environment:
          process.env.LANGFUSE_TRACING_ENVIRONMENT ?? process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
      })
    : null;

  return spanProcessor;
}

/**
 * Register a standalone OpenTelemetry provider that exports to Langfuse.
 * Only call this when no other SDK (Sentry) registers a global provider in the process.
 */
let standaloneRegistered = false;
export function registerStandaloneTracing(): void {
  const processor = getLangfuseSpanProcessor();
  if (!processor || standaloneRegistered) {
    return;
  }

  new NodeTracerProvider({ spanProcessors: [processor] }).register();
  standaloneRegistered = true;
}

/**
 * Send buffered spans to Langfuse. Safe to call when tracing is disabled.
 * Never throws: an unreachable or misconfigured Langfuse must not break requests or eval runs.
 */
export async function flushTraces(): Promise<void> {
  try {
    await spanProcessor?.forceFlush();
  } catch (error) {
    console.warn('Langfuse trace export failed:', error instanceof Error ? error.message : error);
  }
}
