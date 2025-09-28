export class QueueManager {
  constructor(_config: any) {}
  on(_event: string, _listener: (...args: any[]) => void): this {
    return this;
  }
  initialize() {}
  shutdown() {}
  addJob(_name: string, _data: any) {}
  getStats(): any {
    return {
      completed: 0,
      failed: 0,
      active: 0,
      waiting: 0,
    };
  }
}
