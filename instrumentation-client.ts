import * as Sentry from '@sentry/nextjs';
import { isDevEnv } from './lib/server/is-dev-env';
import { isTestEnv } from './lib/server/is-test-env';

Sentry.init({
  enabled: !isDevEnv() && !isTestEnv(),
  dsn: 'https://c3904c68031101ada28bf3c18d58cb67@o4507141801574400.ingest.de.sentry.io/4512012574916688',
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
      maskAllInputs: false,
    }),
  ],
  tracesSampleRate: 1,
  enableLogs: true,
  replaysSessionSampleRate: 1,
  replaysOnErrorSampleRate: 1,
  sendDefaultPii: true,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
