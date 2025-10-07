import { expect, type Page } from '@playwright/test';

/**
 * E2E Test Utility Functions
 * Reusable helpers for common test operations
 */

/**
 * Wait for the application to be ready
 */
export async function waitForApp(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="app-ready"]', { timeout: 10000 }).catch(() => {
    // App ready indicator is optional
  });
}

/**
 * Login helper
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

/**
 * Logout helper
 */
export async function logout(page: Page) {
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL('/login');
}

/**
 * Create a new workflow
 */
export async function createWorkflow(page: Page, name: string, description?: string) {
  await page.click('[data-testid="create-workflow-button"]');
  await page.fill('input[name="name"]', name);

  if (description) {
    await page.fill('textarea[name="description"]', description);
  }

  await page.click('button[type="submit"]');

  // Wait for workflow editor to load
  await page.waitForURL(/\/workflow\/[a-zA-Z0-9-]+/, { timeout: 10000 });
}

/**
 * Add a node to the workflow canvas
 */
export async function addNode(page: Page, nodeType: string) {
  // Open node panel if closed
  const panel = page.locator('[data-testid="node-panel"]');
  const isPanelOpen = await panel.isVisible();

  if (!isPanelOpen) {
    await page.click('[data-testid="toggle-node-panel"]');
  }

  // Search for node type
  await page.fill('[data-testid="node-search"]', nodeType);

  // Drag node to canvas (or click to add)
  await page.click(`[data-node-type="${nodeType}"]`);

  // Wait for node to appear on canvas
  await page.waitForSelector(`[data-node-id*="${nodeType}"]`);
}

/**
 * Connect two nodes
 */
export async function connectNodes(page: Page, sourceId: string, targetId: string) {
  const sourceHandle = page.locator(`[data-node-id="${sourceId}"] [data-handlepos="right"]`);
  const targetHandle = page.locator(`[data-node-id="${targetId}"] [data-handlepos="left"]`);

  await sourceHandle.hover();
  await page.mouse.down();

  const targetBox = await targetHandle.boundingBox();
  if (targetBox) {
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
    await page.mouse.up();
  }
}

/**
 * Configure a node
 */
export async function configureNode(page: Page, nodeId: string, config: Record<string, any>) {
  // Click node to select it
  await page.click(`[data-node-id="${nodeId}"]`);

  // Open configuration panel
  await page.click('[data-testid="configure-node"]');

  // Fill in configuration
  for (const [key, value] of Object.entries(config)) {
    await page.fill(`input[name="${key}"]`, String(value));
  }

  // Save configuration
  await page.click('[data-testid="save-node-config"]');
}

/**
 * Save the current workflow
 */
export async function saveWorkflow(page: Page) {
  await page.click('[data-testid="save-workflow"]');

  // Wait for save confirmation
  await expect(page.locator('[data-testid="save-success"]')).toBeVisible({ timeout: 5000 });
}

/**
 * Execute a workflow
 */
export async function executeWorkflow(page: Page) {
  await page.click('[data-testid="execute-workflow"]');

  // Wait for execution to start
  await expect(page.locator('[data-testid="execution-status"]')).toContainText(/running|success/i, {
    timeout: 30000,
  });
}

/**
 * Wait for workflow execution to complete
 */
export async function waitForExecution(page: Page, timeout = 30000) {
  await expect(page.locator('[data-testid="execution-status"]')).toContainText(/success|error/i, {
    timeout,
  });
}

/**
 * Navigate to a page and wait for it to load
 */
export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await waitForApp(page);
}

/**
 * Take a screenshot with a descriptive name
 */
export async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
}

/**
 * Check if element exists
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout: 1000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get toast notification text
 */
export async function getToastText(page: Page): Promise<string | null> {
  const toast = page.locator('[data-testid="toast-message"]').first();
  if (await toast.isVisible({ timeout: 2000 }).catch(() => false)) {
    return await toast.textContent();
  }
  return null;
}

/**
 * Dismiss toast notifications
 */
export async function dismissToasts(page: Page) {
  const toasts = page.locator('[data-testid="toast-close"]');
  const count = await toasts.count();

  for (let i = 0; i < count; i++) {
    await toasts
      .nth(i)
      .click({ timeout: 1000 })
      .catch(() => {});
  }
}

/**
 * Fill form fields
 */
export async function fillForm(page: Page, fields: Record<string, string>) {
  for (const [name, value] of Object.entries(fields)) {
    const input = page.locator(
      `input[name="${name}"], textarea[name="${name}"], select[name="${name}"]`
    );
    await input.fill(value);
  }
}

/**
 * Wait for API response
 */
export async function waitForAPI(page: Page, urlPattern: string | RegExp, timeout = 10000) {
  return await page.waitForResponse(
    (response) => {
      const url = response.url();
      return typeof urlPattern === 'string' ? url.includes(urlPattern) : urlPattern.test(url);
    },
    { timeout }
  );
}

/**
 * Mock API response
 */
export async function mockAPI(page: Page, url: string | RegExp, response: any, status = 200) {
  await page.route(url, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}
