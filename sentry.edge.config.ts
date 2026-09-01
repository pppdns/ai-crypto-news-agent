import * as Sentry from '@sentry/nextjs';
import { isDevEnv } from '@/lib/server/is-dev-env';
import { isTestEnv } from '@/lib/server/is-test-env';

Sentry.init({
  enabled: !isDevEnv() && !isTestEnv(),
  dsn: 'https://77631f1438980c9bf57df376f37072fb@o4510280463613952.ingest.us.sentry.io/4510280509882368',
  tracesSampleRate: 1,
  enableLogs: true,
  sendDefaultPii: true,
});
