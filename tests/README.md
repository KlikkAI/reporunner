# Reporunner Test Suite

Comprehensive testing setup for the Reporunner monorepo using Vitest.

## Overview

The test suite consists of:
- **Unit Tests**: Fast, isolated tests for individual functions and components
- **Integration Tests**: Tests for feature interactions and API endpoints
- **E2E Tests**: Browser-based tests using Playwright (see `/packages/frontend/tests/e2e/`)
- **Infrastructure Tests**: Smoke tests for deployment configurations (see `/infrastructure/tests/`)

## Quick Start

### Run All Tests

```bash
# Run all tests across the monorepo
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch

# Run tests for specific package
pnpm test --filter @reporunner/backend
```

### Run Tests by Type

```bash
# Unit tests only
pnpm test:unit

# Integration tests only
pnpm test:integration

# E2E tests (Playwright)
pnpm test:e2e
```

### Coverage Reports

```bash
# Generate coverage report
pnpm test:coverage

# View HTML coverage report
open coverage/index.html
```

## Project Structure

```
tests/
├── setup.ts           # Global test setup
└── README.md          # This file

packages/
├── frontend/
│   ├── tests/
│   │   ├── e2e/       # Playwright E2E tests
│   │   ├── unit/      # Unit tests
│   │   └── setup.ts   # Frontend test setup
│   └── vitest.config.ts
├── backend/
│   ├── tests/
│   │   ├── unit/      # Unit tests
│   │   ├── integration/ # Integration tests
│   │   └── setup.ts   # Backend test setup
│   └── vitest.config.ts
└── @reporunner/
    ├── ai/tests/
    ├── auth/tests/
    ├── database/tests/
    └── ...
```

## Test Configuration

### Workspace Configuration

The monorepo uses `vitest.workspace.ts` to configure tests for all packages:
- **Frontend**: jsdom environment for React testing
- **Backend**: Node environment for API testing
- **Packages**: Individual configurations per package

### Coverage Thresholds

Minimum coverage requirements by package:
- **Core/Shared**: 80% (lines, functions, statements), 75% (branches)
- **Auth**: 80% (lines, functions, statements), 75% (branches)
- **Frontend/Backend**: 70% (all metrics)
- **AI**: 60% (all metrics) - lower due to external API dependencies

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { someFunction } from './someFunction';

describe('someFunction', () => {
  it('should return expected value', () => {
    const result = someFunction('input');
    expect(result).toBe('expected');
  });

  it('should handle edge cases', () => {
    expect(someFunction(null)).toBeNull();
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { setupTestDb, teardownTestDb } from './helpers/db';

describe('POST /api/workflows', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  it('should create a workflow', async () => {
    const response = await request(app)
      .post('/api/workflows')
      .send({ name: 'Test Workflow' })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Test Workflow');
  });
});
```

### React Component Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await userEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Test Helpers and Utilities

### Common Test Utilities

Located in each package's `tests/helpers/` directory:
- **Database Helpers**: Setup/teardown test databases
- **Auth Helpers**: Generate test tokens, create test users
- **Mock Data**: Factories for test data generation
- **API Helpers**: Request helpers, mock responses

### Example Database Helper

```typescript
// packages/backend/tests/helpers/db.ts
import mongoose from 'mongoose';

export async function setupTestDb() {
  await mongoose.connect(process.env.MONGODB_URI!);
  await mongoose.connection.dropDatabase();
}

export async function teardownTestDb() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
}
```

## Mocking

### Mocking External APIs

```typescript
import { vi } from 'vitest';
import axios from 'axios';

vi.mock('axios');

describe('API Client', () => {
  it('should fetch data', async () => {
    const mockData = { id: 1, name: 'Test' };
    (axios.get as any).mockResolvedValue({ data: mockData });

    const result = await fetchData();
    expect(result).toEqual(mockData);
  });
});
```

### Mocking Modules

```typescript
vi.mock('../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

### GitLab CI

```yaml
test:
  image: node:18
  script:
    - corepack enable
    - pnpm install
    - pnpm test:coverage
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
```

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use `beforeEach` to reset state
- Clean up after tests in `afterEach`

### 2. Descriptive Names
```typescript
// Good
it('should return 404 when workflow not found', () => {});

// Bad
it('test1', () => {});
```

### 3. Arrange-Act-Assert Pattern
```typescript
it('should create user', async () => {
  // Arrange
  const userData = { email: 'test@example.com', password: 'password123' };

  // Act
  const user = await createUser(userData);

  // Assert
  expect(user.email).toBe(userData.email);
});
```

### 4. Don't Test Implementation Details
```typescript
// Good - test behavior
it('should display error message on invalid input', () => {
  render(<Form />);
  userEvent.type(screen.getByLabelText('Email'), 'invalid');
  expect(screen.getByText(/invalid email/i)).toBeVisible();
});

// Bad - test implementation
it('should call validateEmail function', () => {
  const spy = vi.spyOn(utils, 'validateEmail');
  // ...
});
```

### 5. Use Test Data Builders
```typescript
// Create reusable test data factories
function createTestWorkflow(overrides = {}) {
  return {
    id: 'test-id',
    name: 'Test Workflow',
    nodes: [],
    edges: [],
    ...overrides,
  };
}
```

## Debugging Tests

### Run Single Test File
```bash
pnpm vitest run path/to/test.spec.ts
```

### Run Tests Matching Pattern
```bash
pnpm vitest run -t "should create workflow"
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["vitest", "run", "--inspect-brk", "--no-coverage"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Watch Mode
```bash
pnpm vitest --watch
```

## Common Issues

### Issue: Tests hang or timeout

**Solution**:
```typescript
// Increase timeout for specific test
it('slow test', async () => {
  // test code
}, 30000); // 30 second timeout

// Or in config
test: {
  testTimeout: 30000
}
```

### Issue: Database connection errors

**Solution**:
- Ensure test database is running
- Check environment variables
- Use separate test database
- Clean up connections in `afterAll`

### Issue: Flaky tests

**Solution**:
- Avoid timing dependencies
- Use `waitFor` for async operations
- Reset state between tests
- Check for race conditions

## Test Coverage Goals

Current coverage status:
- **Overall**: Target 75%+
- **Critical Paths**: Target 90%+
- **Auth/Security**: Target 80%+
- **UI Components**: Target 70%+

To check coverage:
```bash
pnpm test:coverage
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Test Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## Contributing

When adding new features:
1. Write tests first (TDD approach recommended)
2. Ensure all tests pass: `pnpm test`
3. Check coverage: `pnpm test:coverage`
4. Add integration tests for API changes
5. Update this README if adding new test patterns
