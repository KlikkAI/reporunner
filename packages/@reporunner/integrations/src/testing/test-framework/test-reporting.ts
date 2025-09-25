/**
 * Assert false
 */
assertFalse(value: any, message?: string)
: void
{
  if (value) {
    throw new Error(message || `Expected value to be false`);
  }
}

/**
 * Assert contains
 */
assertContains(array: any[], value: any, message?: string)
: void
{
  if (!array.includes(value)) {
    throw new Error(message || `Expected array to contain ${value}`);
  }
}

/**
 * Assert throws
 */
async;
assertThrows(
    fn: () => Promise<any>,
    expectedError?: string | RegExp,
    message?: string
  )
: Promise<void>
{
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
getResults(integrationName: string)
: TestAssertion[]
{
  const harness = this.harnesses.get(integrationName);
  return harness ? [...harness.assertions] : [];
}

/**
 * Clear results
 */
clearResults(integrationName: string)
: void
{
  const harness = this.harnesses.get(integrationName);
  if (harness) {
    harness.assertions = [];
  }
}

/**
 * Destroy harness
 */
async;
destroyHarness(integrationName: string)
: Promise<void>
{
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
async;
destroyAll();
: Promise<void>
{
    for (const name of this.harnesses.keys()) {
      await this.destroyHarness(name);
    }
