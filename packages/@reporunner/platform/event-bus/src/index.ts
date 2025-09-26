// Simple in-memory event bus for local/development use
export interface LocalEvent {
  id: string;
  type: string;
  source: string;
  timestamp: Date;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface LocalEventHandler {
  handle(event: LocalEvent): Promise<void>;
}

export interface LocalEventSubscription {
  id: string;
  eventType: string;
  handler: LocalEventHandler;
  filter?: (event: LocalEvent) => boolean;
}

export class LocalEventBus {
  private subscriptions = new Map<string, LocalEventSubscription[]>();
  private eventHistory: LocalEvent[] = [];

  async publish(event: Omit<LocalEvent, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: LocalEvent = {
      ...event,
      id: this.generateId(),
      timestamp: new Date(),
    };

    this.eventHistory.push(fullEvent);

    const handlers = this.subscriptions.get(event.type) || [];
    await Promise.all(
      handlers
        .filter((sub) => !sub.filter || sub.filter(fullEvent))
        .map((sub) => sub.handler.handle(fullEvent))
    );
  }

  subscribe(eventType: string, handler: LocalEventHandler, filter?: (event: LocalEvent) => boolean): string {
    const subscription: LocalEventSubscription = {
      id: this.generateId(),
      eventType,
      handler,
      filter,
    };

    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }
    this.subscriptions.get(eventType)?.push(subscription);

    return subscription.id;
  }

  unsubscribe(subscriptionId: string): boolean {
    for (const [_eventType, subs] of this.subscriptions.entries()) {
      const index = subs.findIndex((sub) => sub.id === subscriptionId);
      if (index !== -1) {
        subs.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Export distributed event bus for production use
export * from './distributed-event-bus';

// Export handlers and middleware
export * from './handlers';
export * from './middleware';
