// Test controller for source mapping validation
export class TestController {
  public testMethod(): string {
    const result = 'test result';
    return result;
  }

  public async asyncMethod(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
