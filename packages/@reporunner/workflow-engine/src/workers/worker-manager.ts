export class WorkerManager {
  constructor(_config: any) {}
  on(_event: string, _listener: (...args: any[]) => void): this {
    return this;
  }
  initialize() {}
  shutdown() {}
  getStats(): any[] {
    return [];
  }
}
