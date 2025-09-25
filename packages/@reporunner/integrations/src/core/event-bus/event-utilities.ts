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
  async publish(event: string, data: any, metadata?: Record<string, any>): Promise<void> {
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
