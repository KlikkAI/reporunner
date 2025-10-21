# KlikkFlow E2E Tests

End-to-end testing suite for KlikkFlow using Playwright.

## Overview

This test suite covers critical user journeys:
- **Authentication**: Login, logout, registration
- **Workflow Creation**: Creating, editing, saving workflows
- **Workflow Execution**: Running workflows, viewing results
- **Credentials Management**: Creating, testing, managing credentials

## Quick Start

### Install Dependencies

```bash
# Install Playwright
pnpm install --filter @klikkflow/frontend

# Install Playwright browsers
pnpm exec playwright install
```

### Run Tests

```bash
# Run all tests
pnpm test:e2e

# Run tests in headed mode (see browser)
pnpm test:e2e:headed

# Run specific test file
pnpm exec playwright test auth.spec.ts

# Run tests in UI mode (interactive)
pnpm test:e2e:ui

# Debug tests
pnpm test:e2e:debug
```

### View Reports

```bash
# Show HTML report
pnpm exec playwright show-report

# Generate and open report
pnpm test:e2e:report
```

## Project Structure

```
tests/e2e/
├── fixtures/          # Test data and fixtures
│   └── test-workflows.ts
├── helpers/           # Reusable test utilities
│   └── test-utils.ts
├── specs/             # Test specifications
│   ├── auth.spec.ts
│   ├── workflow-creation.spec.ts
│   ├── workflow-execution.spec.ts
│   └── credentials.spec.ts
├── global-setup.ts    # Global test setup
├── global-teardown.ts # Global test teardown
└── README.md
```

## Configuration

Configuration is in `playwright.config.ts` at the project root.

### Key Settings

- **baseURL**: `http://localhost:3000` (default)
- **Browsers**: Chromium, Firefox, WebKit
- **Timeouts**: 30s test timeout, 5s assertion timeout
- **Retries**: 2 retries on CI, 0 locally
- **Screenshots**: Captured on failure
- **Videos**: Recorded on failure
- **Traces**: Collected on retry

### Environment Variables

```bash
# Base URL for tests
PLAYWRIGHT_BASE_URL=http://localhost:3000

# Test user credentials
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123

# Gmail OAuth credentials for testing
TEST_GMAIL_CLIENT_ID=your-client-id
TEST_GMAIL_CLIENT_SECRET=your-client-secret
TEST_GMAIL_ACCESS_TOKEN=your-access-token
TEST_GMAIL_REFRESH_TOKEN=your-refresh-token
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { login } from '../helpers/test-utils';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await login(page, 'test@example.com', 'testpassword123');
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    await page.goto('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });
});
```

### Using Test Utilities

```typescript
import {
  login,
  logout,
  createWorkflow,
  addNode,
  connectNodes,
  configureNode,
  saveWorkflow,
  executeWorkflow,
  waitForExecution,
} from '../helpers/test-utils';

test('create and run workflow', async ({ page }) => {
  await login(page, 'test@example.com', 'password');
  await createWorkflow(page, 'My Workflow');
  await addNode(page, 'manual-trigger');
  await addNode(page, 'http-request');
  await connectNodes(page, 'trigger-1', 'action-1');
  await saveWorkflow(page);
  await executeWorkflow(page);
  await waitForExecution(page);

  await expect(page.locator('[data-testid="execution-status"]')).toContainText('success');
});
```

### Using Fixtures

```typescript
import { simpleWorkflow, conditionalWorkflow } from '../fixtures/test-workflows';

test('create workflow from fixture', async ({ page }) => {
  // Use pre-defined workflow structure
  // ... implementation
});
```

## Best Practices

### 1. Use Data Test IDs

```html
<!-- In your React components -->
<button data-testid="create-workflow-button">Create Workflow</button>
```

```typescript
// In tests
await page.click('[data-testid="create-workflow-button"]');
```

### 2. Wait for Elements Properly

```typescript
// Good - explicit wait
await page.waitForSelector('[data-testid="workflow-list"]');
await page.click('[data-testid="create-button"]');

// Bad - implicit wait may fail
await page.click('[data-testid="create-button"]');
```

### 3. Use Page Object Model for Complex Pages

```typescript
class WorkflowPage {
  constructor(private page: Page) {}

  async addNode(type: string) {
    await this.page.click('[data-testid="node-panel"]');
    await this.page.fill('[data-testid="node-search"]', type);
    await this.page.click(`[data-node-type="${type}"]`);
  }

  async save() {
    await this.page.click('[data-testid="save-workflow"]');
    await this.page.waitForSelector('[data-testid="save-success"]');
  }
}
```

### 4. Isolate Test Data

```typescript
// Use unique identifiers to avoid conflicts
const workflowName = `Test Workflow ${Date.now()}`;
const email = `test-${Date.now()}@example.com`;
```

### 5. Clean Up After Tests

```typescript
test.afterEach(async ({ page }) => {
  // Clean up test data
  await deleteTestWorkflows(page);
});
```

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests

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

      - name: Install Playwright Browsers
        run: pnpm exec playwright install --with-deps

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

### GitLab CI

```yaml
e2e-tests:
  image: mcr.microsoft.com/playwright:v1.40.0-focal
  script:
    - pnpm install
    - pnpm exec playwright install
    - pnpm test:e2e
  artifacts:
    when: always
    paths:
      - playwright-report/
    expire_in: 30 days
```

## Debugging

### Interactive Debugging

```bash
# Run in debug mode
pnpm test:e2e:debug

# Run specific test in debug mode
pnpm exec playwright test --debug auth.spec.ts
```

### Playwright Inspector

When in debug mode, Playwright Inspector will open automatically, allowing you to:
- Step through tests
- Inspect selectors
- View console logs
- Record new tests

### VS Code Extension

Install the [Playwright Test for VS Code](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) extension for:
- Running tests from the editor
- Debugging with breakpoints
- Test Explorer integration

## Common Issues

### Issue: Tests fail with "Element not found"

**Solution**: Add proper waits:
```typescript
await page.waitForSelector('[data-testid="element"]');
await page.click('[data-testid="element"]');
```

### Issue: Flaky tests

**Solution**:
1. Use proper waits instead of timeouts
2. Wait for network idle: `await page.waitForLoadState('networkidle')`
3. Use `test.retry()` for known flaky tests
4. Check for race conditions

### Issue: Tests pass locally but fail in CI

**Solution**:
1. Check for timezone/locale differences
2. Ensure consistent viewport sizes
3. Use `process.env.CI` to adjust behavior
4. Check for missing environment variables

## Test Coverage

Current coverage areas:
- ✅ Authentication (login, logout, registration)
- ✅ Workflow creation and editing
- ✅ Workflow execution and monitoring
- ✅ Credentials management
- ⚠️ Integrations (partial coverage)
- ⚠️ Settings and preferences (partial coverage)

Target: 80%+ coverage of critical user paths

## Contributing

When adding new features:
1. Write E2E tests for critical paths
2. Use data-testid attributes
3. Follow existing test patterns
4. Update this README if adding new patterns

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-test)
- [Debugging Guide](https://playwright.dev/docs/debug)
