# Testing Guide

This project uses [Vitest](https://vitest.dev/) as its testing framework.

## Overview

- **Test Framework**: Vitest
- **Test Type**: Unit tests
- **Test Location**: Co-located with source files (e.g., `lib/server/url-utils.test.ts`)
- **Environment**: Node.js

## Running Tests

### Run tests in watch mode (default)

```bash
npm test
```

This will run tests and watch for changes, re-running affected tests automatically.

### Run tests once (CI mode)

```bash
npm run test:run
```

This runs all tests once and exits, useful for CI/CD pipelines.

### Run tests with UI

```bash
npm run test:ui
```

Opens Vitest's interactive UI in your browser for exploring and debugging tests.

### Run tests with coverage

```bash
npm run test:coverage
```

Generates a coverage report showing which parts of your code are tested.

## Writing Tests

### File Naming Convention

Test files should be co-located with the source files they test and use one of these naming patterns:

- `*.test.ts` (preferred)
- `*.spec.ts`
- `*.test.tsx` (for components, when React testing is added)
- `*.spec.tsx`

### Example Test Structure

```typescript
import { describe, expect, it } from 'vitest';
import { functionToTest } from './module';

describe('functionToTest', () => {
  it('should do something', () => {
    const result = functionToTest('input');
    expect(result).toBe('expected output');
  });

  it('should handle edge cases', () => {
    expect(() => functionToTest(null)).toThrow();
  });
});
```

### Available Test APIs

Vitest provides a Jest-compatible API with global access to:

- `describe()` - Group related tests
- `it()` / `test()` - Define individual test cases
- `expect()` - Make assertions
- `beforeEach()` / `afterEach()` - Setup and teardown for each test
- `beforeAll()` / `afterAll()` - Setup and teardown for all tests in a suite
- `vi.mock()` - Mock modules and functions
- `vi.fn()` - Create mock functions

See the [Vitest API documentation](https://vitest.dev/api/) for more details.

## Example Tests

See `lib/server/url-utils.test.ts` for a complete example of unit tests testing URL normalization and hashing utilities.

## Configuration

The Vitest configuration is in `vitest.config.ts`. Key settings:

- **Environment**: Node.js (for server-side code)
- **Globals**: Enabled (no need to import `describe`, `it`, `expect`)
- **Path Aliases**: `@/` maps to project root (matches `tsconfig.json`)
- **Test Timeout**: 10 seconds per test
- **Coverage Provider**: v8

## What to Test

Focus on testing:

1. **Utility functions** - Pure functions with clear inputs/outputs
2. **Business logic** - Core algorithms and data transformations
3. **Edge cases** - Error handling, boundary conditions, invalid inputs
4. **Data processing** - Chunking, parsing, normalization
5. **Integration points** - Module interactions (with proper mocking)

## What NOT to Test (for now)

Currently excluded from testing:

- Database operations (Supabase/PostgreSQL)
- External API calls (OpenAI, Firecrawl)
- React components
- Next.js route handlers
- Browser-specific behavior

These may be added in future iterations with appropriate test infrastructure.

## Best Practices

1. **Keep tests simple and focused** - One assertion per test when possible
2. **Use descriptive test names** - Test names should explain what is being tested
3. **Avoid testing implementation details** - Test behavior, not internal structure
4. **Mock external dependencies** - Don't make real API calls or database queries in unit tests
5. **Keep tests fast** - Unit tests should run in milliseconds
6. **Use `beforeEach` for common setup** - DRY principle applies to tests too
7. **Test both happy paths and error cases** - Don't just test when things work

## Continuous Integration

Tests are designed to run in CI/CD pipelines. Use:

```bash
npm run test:run
```

This command will:

- Run all tests once
- Exit with non-zero code if any test fails
- Complete in a reasonable time

## Debugging Tests

### Run a specific test file

```bash
npx vitest run path/to/test-file.test.ts
```

### Run tests matching a pattern

```bash
npx vitest run --grep "normalizeUrl"
```

### Debug with VS Code

Add this configuration to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Future Enhancements

Potential testing improvements:

- [ ] React component testing with Testing Library
- [ ] Integration tests with test database
- [ ] E2E tests with Playwright
- [ ] Visual regression testing
- [ ] Performance benchmarking tests
- [ ] API contract testing
- [ ] Snapshot testing for LLM prompts
