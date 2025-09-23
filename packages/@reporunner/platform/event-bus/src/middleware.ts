import type { Event } from './index';

export interface EventMiddleware {
  process(event: Event, next: () => Promise<void>): Promise<void>;
}

export class LoggingMiddleware implements EventMiddleware {
  async process(_event: Event, next: () => Promise<void>): Promise<void> {
    await next();
  }
}

export class ValidationMiddleware implements EventMiddleware {
  async process(event: Event, next: () => Promise<void>): Promise<void> {
    // TODO: Implement event validation
    if (!event.type || !event.source) {
      throw new Error('Invalid event: missing type or source');
    }
    await next();
  }
}

export class RateLimitMiddleware implements EventMiddleware {
  private eventCounts = new Map<string, number>();
  private readonly maxEventsPerMinute = 100;

  async process(event: Event, next: () => Promise<void>): Promise<void> {
    const key = `${event.source}:${event.type}`;
    const count = this.eventCounts.get(key) || 0;

    if (count >= this.maxEventsPerMinute) {
      throw new Error('Rate limit exceeded');
    }

    this.eventCounts.set(key, count + 1);

    // Reset counter after 1 minute
    setTimeout(() => {
      this.eventCounts.delete(key);
    }, 60000);

    await next();
  }
}
