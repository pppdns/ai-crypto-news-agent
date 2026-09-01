import * as Sentry from '@sentry/nextjs';
import { isDevEnv } from '@/lib/server/is-dev-env';
import { isTestEnv } from '@/lib/server/is-test-env';

Sentry.init({
  enabled: !isDevEnv() && !isTestEnv(),
  dsn: 'https://c3904c68031101ada28bf3c18d58cb67@o4507141801574400.ingest.de.sentry.io/4512012574916688',
  tracesSampleRate: 1,
  enableLogs: true,
  sendDefaultPii: true,
});
