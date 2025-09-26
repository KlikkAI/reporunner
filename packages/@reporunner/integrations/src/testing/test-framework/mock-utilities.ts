await harness.mockServer.start();
}

      // Initialize integration
      await harness.integration.initialize(harness.context)

// Run test function
await testFn(harness)

assertion.passed = true
assertion.message = 'Test passed successfully'
} catch (error: any)
{
  assertion.passed = false;
  assertion.message = error.message;
  assertion.error = error;
}
finally
{
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
    tests: Array<
{
  name: string;
  fn: (harness: IntegrationTestHarness) => Promise<void>;
}
>
  ): Promise<
{
  passed: number;
  failed: number;
  assertions: TestAssertion[]
}
>
{
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
assertEqual(actual: any, expected: any, message?: string)
: void
{
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected} but got ${actual}`);
  }
}

/**
 * Assert not equal
 */
assertNotEqual(actual: any, expected: any, message?: string)
: void
{
  if (actual === expected) {
    throw new Error(message || `Expected value to not equal ${expected}`);
  }
}

/**
 * Assert true
 */
assertTrue(value: any, message?: string)
: void
{
  if (!value) {
    throw new Error(message || `Expected value to be true`);
  }
}
