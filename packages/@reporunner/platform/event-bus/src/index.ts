export interface Event {
  id: string;
  type: string;
  source: string;
  timestamp: Date;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface EventHandler {
  handle(event: Event): Promise<void>;
}

export interface EventSubscription {
  id: string;
  eventType: string;
  handler: EventHandler;
  filter?: (event: Event) => boolean;
}

export class EventBus {
  private subscriptions = new Map<string, EventSubscription[]>();
  private eventHistory: Event[] = [];

  async publish(event: Omit<Event, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: Event = {
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

  subscribe(eventType: string, handler: EventHandler, filter?: (event: Event) => boolean): string {
    const subscription: EventSubscription = {
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

export * from './handlers';
export * from './middleware';
