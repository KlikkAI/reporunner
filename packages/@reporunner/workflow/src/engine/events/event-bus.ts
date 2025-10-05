export class EventBus {
  on(_event: string, _listener: (...args: any[]) => void): this {
    return this;
  }
  emit(_event: string, ..._args: any[]): boolean {
    return true;
  }
  initialize() {}
  shutdown() {}
}
