clearLogs();
: void
{
  this.requestLogs = [];
}

/**
 * Reset responses
 */
resetResponses();
: void
{
  this.responses.clear();
}

/**
 * Reset all
 */
reset();
: void
{
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
