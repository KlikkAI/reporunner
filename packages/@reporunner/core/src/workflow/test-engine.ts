// Test engine for source mapping validation
export class TestEngine {
  private isRunning = false;

  public start(): void {
    this.isRunning = true;
    console.log('Engine started');
  }

  public stop(): void {
    this.isRunning = false;
    console.log('Engine stopped');
  }

  public getStatus(): boolean {
    return this.isRunning;
  }
}
