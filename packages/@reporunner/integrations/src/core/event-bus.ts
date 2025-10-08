import { EventEmitter } from 'node:events';

export interface EventPayload {
  source: string;
  event: string;
  data: unknown;
  timestamp: Date;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export interface EventSubscription {
  id: string;
  pattern: string | RegExp;
  handler: EventHandler;
  filter?: EventFilter;
  once?: boolean;
  priority?: number;
  createdAt: Date;
}

export type EventHandler = (payload: EventPayload) => Promise<void> | void;
export type EventFilter = (payload: EventPayload) => boolean;

export interface EventBusConfig {
  maxListeners?: number;
  enableLogging?: boolean;
  persistEvents?: boolean;
  maxEventHistory?: number;
}

export class IntegrationEventBus extends EventEmitter {
  private subscriptions: Map<string, EventSubscription> = new Map();
  private eventHistory: EventPayload[] = [];
  private config: EventBusConfig;
  private processingQueue: EventPayload[] = [];
  private isProcessing: boolean = false;

  constructor(config: EventBusConfig = {}) {
    super();
    this.config = {
      maxListeners: config.maxListeners || 100,
      enableLogging: config.enableLogging !== false,
      persistEvents: config.persistEvents,
      maxEventHistory: config.maxEventHistory || 1000,
    };

    this.setMaxListeners(this.config.maxListeners || 100);
  }

  /**
   * Publish event to the bus
   */
  async publish(
    source: string,
    event: string,
    data: unknown,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const payload: EventPayload = {
      source,
      event,
      data,
      timestamp: new Date(),
      correlationId: this.generateCorrelationId(),
      metadata,
    };

    // Add to history
    if (this.config.persistEvents) {
      this.addToHistory(payload);
    }

    // Log event
    if (this.config.enableLogging) {
      this.logEvent('published', payload);
    }

    // Add to processing queue
    this.processingQueue.push(payload);

    // Process queue if not already processing
    if (!this.isProcessing) {
      await this.processQueue();
    }

    // Emit for direct listeners
    this.emit('event:published', payload);
  }

  /**
   * Subscribe to events
   */
  subscribe(
    pattern: string | RegExp,
    handler: EventHandler,
    options: {
      filter?: EventFilter;
      once?: boolean;
      priority?: number;
    } = {}
  ): string {
    const subscriptionId = this.generateSubscriptionId();

    const subscription: EventSubscription = {
      id: subscriptionId,
      pattern,
      handler,
      filter: options.filter,
      once: options.once,
      priority: options.priority || 0,
      createdAt: new Date(),
    };

    this.subscriptions.set(subscriptionId, subscription);

    this.emit('subscription:created', {
      id: subscriptionId,
      pattern: pattern.toString(),
    });

    return subscriptionId;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): boolean {
    const existed = this.subscriptions.delete(subscriptionId);

    if (existed) {
      this.emit('subscription:removed', { id: subscriptionId });
    }

    return existed;
  }

  /**
   * Process event queue
   */
  private async processQueue(): Promise<void> {
    this.isProcessing = true;

    while (this.processingQueue.length > 0) {
      const payload = this.processingQueue.shift();
      if (!payload) {
        continue;
      }

      await this.processEvent(payload);
    }

    this.isProcessing = false;
  }

  /**
   * Process single event
   */
  private async processEvent(payload: EventPayload): Promise<void> {
    const eventKey = `${payload.source}:${payload.event}`;

    // Get matching subscriptions
    const matchingSubscriptions = this.getMatchingSubscriptions(eventKey, payload);

    // Sort by priority (higher priority first)
    matchingSubscriptions.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Execute handlers
    for (const subscription of matchingSubscriptions) {
      try {
        await this.executeHandler(subscription, payload);

        // Remove if it was a one-time subscription
        if (subscription.once) {
          this.subscriptions.delete(subscription.id);
        }
      } catch (error: unknown) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        this.handleError(subscription, payload, errorObj);
      }
    }
  }

  /**
   * Get matching subscriptions for an event
   */
  private getMatchingSubscriptions(eventKey: string, payload: EventPayload): EventSubscription[] {
    const matching: EventSubscription[] = [];

    this.subscriptions.forEach((subscription) => {
      // Check pattern match
      let matches = false;

      if (typeof subscription.pattern === 'string') {
        // Exact match or wildcard pattern
        if (subscription.pattern === '*' || subscription.pattern === '**') {
          matches = true;
        } else if (subscription.pattern.includes('*')) {
          matches = this.matchWildcard(eventKey, subscription.pattern);
        } else {
          matches = eventKey === subscription.pattern;
        }
      } else if (subscription.pattern instanceof RegExp) {
        matches = subscription.pattern.test(eventKey);
      }

      // Apply filter if matches and filter exists
      if (matches && subscription.filter) {
        matches = subscription.filter(payload);
      }

      if (matches) {
        matching.push(subscription);
      }
    });

    return matching;
  }

  /**
   * Match wildcard pattern
   */
  private matchWildcard(text: string, pattern: string): boolean {
    // Convert wildcard pattern to regex
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(text);
  }

  /**
   * Execute handler
   */
  private async executeHandler(
    subscription: EventSubscription,
    payload: EventPayload
  ): Promise<void> {
    const startTime = Date.now();

    await subscription.handler(payload);

    const duration = Date.now() - startTime;

    this.emit('handler:executed', {
      subscriptionId: subscription.id,
      eventKey: `${payload.source}:${payload.event}`,
      duration,
      correlationId: payload.correlationId,
    });

    if (this.config.enableLogging) {
      this.logEvent('handled', payload, {
        subscriptionId: subscription.id,
        duration,
      });
    }
  }

  /**
   * Handle handler error
   */
  private handleError(subscription: EventSubscription, payload: EventPayload, error: Error): void {
    this.emit('handler:error', {
      subscriptionId: subscription.id,
      eventKey: `${payload.source}:${payload.event}`,
      error: error.message,
      correlationId: payload.correlationId,
    });

    if (this.config.enableLogging) {
      // Log event processing for debugging
    }
  }

  /**
   * Add event to history
   */
  private addToHistory(payload: EventPayload): void {
    this.eventHistory.push(payload);

    // Trim history if needed
    const maxHistory = this.config.maxEventHistory || 1000;
    if (this.eventHistory.length > maxHistory) {
      this.eventHistory = this.eventHistory.slice(-maxHistory);
    }
  }

  /**
   * Get event history
   */
  getHistory(filter?: {
    source?: string;
    event?: string;
    since?: Date;
    limit?: number;
  }): EventPayload[] {
    let history = [...this.eventHistory];

    if (filter) {
      if (filter.source) {
        history = history.filter((e) => e.source === filter.source);
      }
      if (filter.event) {
        history = history.filter((e) => e.event === filter.event);
      }
      if (filter.since) {
        history = history.filter((e) => filter.since && e.timestamp >= filter.since);
      }
      if (filter.limit) {
        history = history.slice(-filter.limit);
      }
    }

    return history;
  }

  /**
   * Wait for event
   */
  async waitForEvent(
    pattern: string | RegExp,
    timeout: number = 30000,
    filter?: EventFilter
  ): Promise<EventPayload> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.unsubscribe(subscriptionId);
        reject(new Error('Event wait timeout'));
      }, timeout);

      const subscriptionId = this.subscribe(
        pattern,
        (payload) => {
          clearTimeout(timer);
          this.unsubscribe(subscriptionId);
          resolve(payload);
        },
        { filter, once: true }
      );
    });
  }

  /**
   * Create event channel
   */
  createChannel(namespace: string): EventChannel {
    return new EventChannel(this, namespace);
  }

  /**
   * Log event
   */
  private logEvent(
    _action: string,
    _payload: EventPayload,
    _extra?: Record<string, unknown>
  ): void {
    // Empty by default - override in subclass for logging
  }

  /**
   * Generate correlation ID
   */
  private generateCorrelationId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalSubscriptions: number;
    queueSize: number;
    historySize: number;
    subscriptionsByPattern: Record<string, number>;
  } {
    const stats: {
      totalSubscriptions: number;
      queueSize: number;
      historySize: number;
      subscriptionsByPattern: Record<string, number>;
    } = {
      totalSubscriptions: this.subscriptions.size,
      queueSize: this.processingQueue.length,
      historySize: this.eventHistory.length,
      subscriptionsByPattern: {},
    };

    this.subscriptions.forEach((sub) => {
      const pattern = sub.pattern.toString();
      stats.subscriptionsByPattern[pattern] = (stats.subscriptionsByPattern[pattern] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clear all
   */
  clearAll(): void {
    this.subscriptions.clear();
    this.eventHistory = [];
    this.processingQueue = [];
    this.removeAllListeners();
  }
}

/**
 * Event channel for namespaced events
 */
export class EventChannel {
  constructor(
    private bus: IntegrationEventBus,
    private namespace: string
  ) {}

  /**
   * Publish event to channel
   */
  async publish(event: string, data: unknown, metadata?: Record<string, unknown>): Promise<void> {
    await this.bus.publish(this.namespace, event, data, metadata);
  }

  /**
   * Subscribe to channel events
   */
  subscribe(
    pattern: string | RegExp,
    handler: EventHandler,
    options?: {
      filter?: EventFilter;
      once?: boolean;
      priority?: number;
    }
  ): string {
    // Prefix pattern with namespace
    const namespacedPattern =
      typeof pattern === 'string'
        ? `${this.namespace}:${pattern}`
        : new RegExp(`^${this.namespace}:${pattern.source}$`, pattern.flags);

    return this.bus.subscribe(namespacedPattern, handler, options);
  }

  /**
   * Wait for channel event
   */
  async waitForEvent(
    pattern: string | RegExp,
    timeout?: number,
    filter?: EventFilter
  ): Promise<EventPayload> {
    const namespacedPattern =
      typeof pattern === 'string'
        ? `${this.namespace}:${pattern}`
        : new RegExp(`^${this.namespace}:${pattern.source}$`, pattern.flags);

    return this.bus.waitForEvent(namespacedPattern, timeout, filter);
  }
}

// Singleton instance
export const integrationEventBus = new IntegrationEventBus();

export default IntegrationEventBus;
