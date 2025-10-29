import { loadEnvConfig } from '@next/env';

export const isDevelopment = process.env.NODE_ENV !== 'production';

export function loadEnv() {
  // Load environment variables
  const projectDir = process.cwd();
  loadEnvConfig(projectDir, isDevelopment, { info: () => {}, error: console.error });
}
