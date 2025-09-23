import { EventEmitter } from 'node:events';
import type { Server } from 'node:http';
import express, { type Express, type Request, type Response } from 'express';
import type {
  BaseIntegration,
  IntegrationConfig,
  IntegrationContext,
} from '../core/base-integration';

export interface MockServerConfig {
  port?: number;
  host?: string;
  basePath?: string;
  responseDelay?: number;
  errorRate?: number;
  logRequests?: boolean;
}

export interface MockResponse {
  status: number;
  body: any;
  headers?: Record<string, string>;
  delay?: number;
}

export interface RequestLog {
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
  timestamp: Date;
}

export class MockServer extends EventEmitter {
  private app: Express;
  private server?: Server;
  private config: MockServerConfig;
  private responses: Map<string, MockResponse> = new Map();
  private requestLogs: RequestLog[] = [];
  private isRunning: boolean = false;

  constructor(config: MockServerConfig = {}) {
    super();
    this.config = {
      port: config.port || 3333,
      host: config.host || 'localhost',
      basePath: config.basePath || '',
      responseDelay: config.responseDelay || 0,
      errorRate: config.errorRate || 0,
      logRequests: config.logRequests !== false,
    };

    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging middleware
    if (this.config.logRequests) {
      this.app.use((req: Request, _res: Response, next) => {
        const log: RequestLog = {
          method: req.method,
          path: req.path,
          headers: req.headers as Record<string, string>,
          body: req.body,
          query: req.query as Record<string, string>,
          timestamp: new Date(),
        };

        this.requestLogs.push(log);
        this.emit('request:logged', log);

        next();
      });
    }

    // Error simulation middleware
    if (this.config.errorRate && this.config.errorRate > 0) {
      this.app.use((_req: Request, res: Response, next) => {
        if (Math.random() < this.config.errorRate!) {
          return res.status(500).json({ error: 'Simulated server error' });
        }
        next();
      });
    }

    // Response delay middleware
    if (this.config.responseDelay && this.config.responseDelay > 0) {
      this.app.use((_req: Request, _res: Response, next) => {
        setTimeout(next, this.config.responseDelay);
      });
    }
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    this.app.all('*', (req: Request, res: Response) => {
      const key = `${req.method}:${req.path}`;
      const mockResponse = this.responses.get(key);

      if (mockResponse) {
        // Apply additional delay if specified
        const delay = mockResponse.delay || 0;

        setTimeout(() => {
          // Set headers
          if (mockResponse.headers) {
            Object.entries(mockResponse.headers).forEach(([name, value]) => {
              res.setHeader(name, value);
            });
          }

          // Send response
          res.status(mockResponse.status).json(mockResponse.body);
        }, delay);
      } else {
        res.status(404).json({ error: 'Mock response not configured' });
      }
    });
  }

  /**
   * Set mock response
   */
  setResponse(method: string, path: string, response: MockResponse): void {
    const key = `${method.toUpperCase()}:${path}`;
    this.responses.set(key, response);

    this.emit('response:set', { method, path, response });
  }

  /**
   * Start server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.config.port, this.config.host!, () => {
        this.isRunning = true;
        this.emit('server:started', {
          host: this.config.host,
          port: this.config.port,
        });
        resolve();
      });

      this.server.on('error', (error) => {
        this.isRunning = false;
        reject(error);
      });
    });
  }

  /**
   * Stop server
   */
  async stop(): Promise<void> {
    if (!this.isRunning || !this.server) {
      return;
    }

    return new Promise((resolve) => {
      this.server?.close(() => {
        this.isRunning = false;
        this.emit('server:stopped');
        resolve();
      });
    });
  }

  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return `http://${this.config.host}:${this.config.port}${this.config.basePath}`;
  }

  /**
   * Get request logs
   */
  getRequestLogs(): RequestLog[] {
    return [...this.requestLogs];
  }

  /**
   * Clear request logs
   */
  clearLogs(): void {
    this.requestLogs = [];
  }

  /**
   * Reset responses
   */
  resetResponses(): void {
    this.responses.clear();
  }

  /**
   * Reset all
   */
  reset(): void {
    this.clearLogs();
    this.resetResponses();
  }
}

export interface IntegrationTestHarness {
  integration: BaseIntegration;
  mockServer?: MockServer;
  context: IntegrationContext;
  assertions: TestAssertion[];
}

export interface TestAssertion {
  name: string;
  passed: boolean;
  message?: string;
  error?: Error;
  duration?: number;
}

export class IntegrationTester extends EventEmitter {
  private harnesses: Map<string, IntegrationTestHarness> = new Map();

  /**
   * Create test harness for integration
   */
  createHarness(
    integrationName: string,
    IntegrationClass: typeof BaseIntegration,
    config: IntegrationConfig,
    useMockServer: boolean = true
  ): IntegrationTestHarness {
    // Create mock server if needed
    let mockServer: MockServer | undefined;
    if (useMockServer) {
      mockServer = new MockServer();
    }

    // Create integration instance
    const integration = new (IntegrationClass as any)(config) as BaseIntegration;

    // Create test context
    const context: IntegrationContext = {
      userId: 'test-user',
      workspaceId: 'test-workspace',
      environment: 'test',
      settings: {},
    };

    const harness: IntegrationTestHarness = {
      integration,
      mockServer,
      context,
      assertions: [],
    };

    this.harnesses.set(integrationName, harness);

    this.emit('harness:created', { integrationName });

    return harness;
  }

  /**
   * Run test
   */
  async runTest(
    integrationName: string,
    testName: string,
    testFn: (harness: IntegrationTestHarness) => Promise<void>
  ): Promise<TestAssertion> {
    const harness = this.harnesses.get(integrationName);
    if (!harness) {
      throw new Error(`Test harness not found for ${integrationName}`);
    }

    const startTime = Date.now();
    const assertion: TestAssertion = {
      name: testName,
      passed: false,
    };

    try {
      // Start mock server if present
      if (harness.mockServer) {
        await harness.mockServer.start();
      }

      // Initialize integration
      await harness.integration.initialize(harness.context);

      // Run test function
      await testFn(harness);

      assertion.passed = true;
      assertion.message = 'Test passed successfully';
    } catch (error: any) {
      assertion.passed = false;
      assertion.message = error.message;
      assertion.error = error;
    } finally {
      assertion.duration = Date.now() - startTime;

      // Cleanup
      if (harness.integration) {
        await harness.integration.cleanup().catch(() => {});
      }
      if (harness.mockServer) {
        await harness.mockServer.stop();
      }
    }

    harness.assertions.push(assertion);

    this.emit('test:completed', {
      integrationName,
      testName,
      assertion,
    });

    return assertion;
  }

  /**
   * Run test suite
   */
  async runSuite(
    integrationName: string,
    tests: Array<{
      name: string;
      fn: (harness: IntegrationTestHarness) => Promise<void>;
    }>
  ): Promise<{ passed: number; failed: number; assertions: TestAssertion[] }> {
    const results: TestAssertion[] = [];
    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      const assertion = await this.runTest(integrationName, test.name, test.fn);
      results.push(assertion);

      if (assertion.passed) {
        passed++;
      } else {
        failed++;
      }
    }

    this.emit('suite:completed', {
      integrationName,
      passed,
      failed,
      total: tests.length,
    });

    return { passed, failed, assertions: results };
  }

  /**
   * Assert equal
   */
  assertEqual(actual: any, expected: any, message?: string): void {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected} but got ${actual}`);
    }
  }

  /**
   * Assert not equal
   */
  assertNotEqual(actual: any, expected: any, message?: string): void {
    if (actual === expected) {
      throw new Error(message || `Expected value to not equal ${expected}`);
    }
  }

  /**
   * Assert true
   */
  assertTrue(value: any, message?: string): void {
    if (!value) {
      throw new Error(message || `Expected value to be true`);
    }
  }

  /**
   * Assert false
   */
  assertFalse(value: any, message?: string): void {
    if (value) {
      throw new Error(message || `Expected value to be false`);
    }
  }

  /**
   * Assert contains
   */
  assertContains(array: any[], value: any, message?: string): void {
    if (!array.includes(value)) {
      throw new Error(message || `Expected array to contain ${value}`);
    }
  }

  /**
   * Assert throws
   */
  async assertThrows(
    fn: () => Promise<any>,
    expectedError?: string | RegExp,
    message?: string
  ): Promise<void> {
    let thrown = false;
    let error: any;

    try {
      await fn();
    } catch (e) {
      thrown = true;
      error = e;
    }

    if (!thrown) {
      throw new Error(message || 'Expected function to throw');
    }

    if (expectedError) {
      const errorMessage = error?.message || '';

      if (typeof expectedError === 'string') {
        if (!errorMessage.includes(expectedError)) {
          throw new Error(
            message || `Expected error to contain "${expectedError}" but got "${errorMessage}"`
          );
        }
      } else if (expectedError instanceof RegExp) {
        if (!expectedError.test(errorMessage)) {
          throw new Error(
            message || `Expected error to match ${expectedError} but got "${errorMessage}"`
          );
        }
      }
    }
  }

  /**
   * Get test results
   */
  getResults(integrationName: string): TestAssertion[] {
    const harness = this.harnesses.get(integrationName);
    return harness ? [...harness.assertions] : [];
  }

  /**
   * Clear results
   */
  clearResults(integrationName: string): void {
    const harness = this.harnesses.get(integrationName);
    if (harness) {
      harness.assertions = [];
    }
  }

  /**
   * Destroy harness
   */
  async destroyHarness(integrationName: string): Promise<void> {
    const harness = this.harnesses.get(integrationName);
    if (harness) {
      if (harness.integration) {
        await harness.integration.cleanup().catch(() => {});
      }
      if (harness.mockServer) {
        await harness.mockServer.stop();
      }
      this.harnesses.delete(integrationName);
    }
  }

  /**
   * Destroy all harnesses
   */
  async destroyAll(): Promise<void> {
    for (const name of this.harnesses.keys()) {
      await this.destroyHarness(name);
    }
  }
}

// Singleton instance
export const integrationTester = new IntegrationTester();

export default IntegrationTester;
