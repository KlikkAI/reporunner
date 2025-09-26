export class QueueManager {
  constructor(config: any) {}
  on(event: string, listener: (...args: any[]) => void): this {
    return this;
  }
  initialize() {}
  shutdown() {}
  addJob(name: string, data: any) {}
  getStats(): any {
    return {
      completed: 0,
      failed: 0,
      active: 0,
      waiting: 0,
    };
  }
}
