import * as Sentry from '@sentry/nextjs';
import { isDevEnv } from '@/lib/server/is-dev-env';
import { isTestEnv } from '@/lib/server/is-test-env';
import { getLangfuseSpanProcessor, registerStandaloneTracing } from '@/lib/server/tracing';

const sentryEnabled = !isDevEnv() && !isTestEnv();
const langfuseSpanProcessor = getLangfuseSpanProcessor();

Sentry.init({
  enabled: sentryEnabled,
  dsn: 'https://77631f1438980c9bf57df376f37072fb@o4510280463613952.ingest.us.sentry.io/4510280509882368',
  tracesSampleRate: 1,
  enableLogs: true,
  sendDefaultPii: true,
  // Sentry owns the OpenTelemetry provider; also export LLM spans to Langfuse (see lib/server/tracing.ts)
  openTelemetrySpanProcessors: langfuseSpanProcessor ? [langfuseSpanProcessor] : [],
});

// With Sentry disabled (local dev) nothing registers a provider, so Langfuse gets its own
if (!sentryEnabled) {
  registerStandaloneTracing();
}
