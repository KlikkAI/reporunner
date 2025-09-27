export interface IEventBus {
  publish(event: string, payload: unknown): Promise<void>;
  subscribe(event: string, handler: (payload: unknown) => Promise<void>): Promise<void>;
  unsubscribe(event: string, handler: (payload: unknown) => Promise<void>): Promise<void>;
}
