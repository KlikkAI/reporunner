export class EventBus {
  on(event: string, listener: (...args: any[]) => void): this {
    return this;
  }
  emit(event: string, ...args: any[]): boolean {
    return true;
  }
  initialize() {}
  shutdown() {}
}
