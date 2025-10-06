// Test controller for source mapping validation
export class TestController {
  constructor() {
    console.log('TestController initialized');
  }

  public testMethod(): string {
    const result = 'test result';
    console.log('Test method called');
    return result;
  }

  public async asyncMethod(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('Async method completed');
  }
}
