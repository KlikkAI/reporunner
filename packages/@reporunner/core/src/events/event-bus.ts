import { IDomainEvent, IDomainEventHandler } from '../service/base-service.interface';

/**
 * Simple in-memory event bus implementation
 */
export class EventBus {
  private static instance: EventBus;
  private handlers: Map<string, IDomainEventHandler<any>[]> = new Map();

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to an event type
   */
  subscribe<T extends IDomainEvent>(
    eventType: string,
    handler: IDomainEventHandler<T>
  ): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
  }

  /**
   * Unsubscribe from an event type
   */
  unsubscribe<T extends IDomainEvent>(
    eventType: string,
    handler: IDomainEventHandler<T>
  ): void {
    const handlers = this.handlers.get(eventType) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
    this.handlers.set(eventType, handlers);
  }

  /**
   * Publish an event
   */
  async publish<T extends IDomainEvent>(event: T): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];
    await Promise.all(
      handlers.map(handler => this.handleSafely(handler, event))
    );
  }

  /**
   * Handle event safely, catching any errors
   */
  private async handleSafely<T extends IDomainEvent>(
    handler: IDomainEventHandler<T>,
    event: T
  ): Promise<void> {
    try {
      await handler.handle(event);
    } catch (error) {
      console.error('Error handling event:', error);
      // Here you could add error reporting, retries, etc.
    }
  }
}