// Test engine for source mapping validation
export class TestEngine {
  private isRunning = false;

  public start(): void {
    this.isRunning = true;
  }

  public stop(): void {
    this.isRunning = false;
  }

  public getStatus(): boolean {
    return this.isRunning;
  }
}
