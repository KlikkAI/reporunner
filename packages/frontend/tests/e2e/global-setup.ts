import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Global setup runs once before all tests
 * Use this for:
 * - Setting up test database
 * - Creating test users
 * - Generating authentication tokens
 * - Starting external services
 */

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');

  const { baseURL } = config.projects[0].use;
  const storageDir = path.join(__dirname, '../../../.playwright');

  // Ensure storage directory exists
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  // Create authenticated state for tests
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('  ✓ Creating authenticated test user...');

    // Navigate to login page
    await page.goto(`${baseURL}/login`);

    // Perform login (adjust selectors based on your app)
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'testpassword123');
    await page.click('button[type="submit"]');

    // Wait for navigation to complete
    await page.waitForURL(`${baseURL}/dashboard`, { timeout: 10000 }).catch(() => {
      console.warn('  ⚠ Could not authenticate - tests will run without auth state');
    });

    // Save storage state for authenticated tests
    await context.storageState({ path: path.join(storageDir, 'auth.json') });

    console.log('  ✓ Authentication state saved');
  } catch (error) {
    console.warn('  ⚠ Authentication setup failed:', error.message);
    console.warn('  Tests will run without pre-authenticated state');
  } finally {
    await browser.close();
  }

  console.log('✅ Global setup complete\n');
}

export default globalSetup;
