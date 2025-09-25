findById: jest.fn(), findAll;
: jest.fn()
    }
}

  static createMockEventBus(): any
{
  return {
      publish: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn()
    };
}

static
createMockCache();
: any
{
  return {
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      ttl: jest.fn(),
      isConnected: jest.fn().mockReturnValue(true)
    };
}

static
createMockLogger();
: any
{
  return {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };
}
}

// Test utilities
export class TestUtils {
  static async waitFor(
    condition: () => boolean | Promise<boolean>,
    timeout = 5000,
    interval = 100
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await TestUtils.sleep(interval);
    }

    throw new Error('Timeout waiting for condition');
  }

  static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static randomId(): string {
    return Math.random().toString(36).substring(7);
  }

  static randomEmail(): string {
    return `test-${this.randomId()}@example.com`;
  }

  static async measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; time: number }> {
    const start = Date.now();
    const result = await fn();
    const time = Date.now() - start;
    return { result, time };
  }
}

// Base test class for common setup/teardown
export abstract class BaseTest {
  protected context: TestContext;

  constructor() {
    this.context = TestContext.getInstance();
  }

  async beforeAll(): Promise<void> {
    await this.context.setup(this.getTestConfig());
  }

  async afterAll(): Promise<void> {
    await this.context.teardown();
  }

  async beforeEach(): Promise<void> {
    await this.context.clean();
  }

  async afterEach(): Promise<void> {
    // Override in child classes if needed
  }

  protected getTestConfig(): TestConfig {
// Override in child classes to customize
