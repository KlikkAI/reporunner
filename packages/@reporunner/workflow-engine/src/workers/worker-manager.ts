export class WorkerManager {
  constructor(config: any) {}
  on(event: string, listener: (...args: any[]) => void): this {
    return this;
  }
  initialize() {}
  shutdown() {}
  getStats(): any[] {
    return [];
  }
}
