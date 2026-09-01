import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use Node.js environment for server-side code
    environment: 'node',

    // Include test files co-located with source files
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

    // Exclude common directories
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
    ],

    // Global test setup
    globals: true,

    // Coverage configuration (optional, can be enabled when needed)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '**/*.config.{js,ts,mjs,cjs}',
        '**/coverage/**',
        '**/*.d.ts',
        '**/types/**',
        '**/supabase/database.types.ts',
      ],
    },

    // Timeout for tests (in milliseconds)
    testTimeout: 10000,

    // Hook timeout
    hookTimeout: 10000,
  },

  // Resolve path aliases to match tsconfig.json
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
