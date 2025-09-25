import { EventEmitter } from 'node:events';

export interface EventPayload {
  source: string;
  event: string;
  data: any;
  timestamp: Date;
  correlationId?: string;
  metadata?: Record<string, any>;
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
      persistEvents: config.persistEvents || false,
      maxEventHistory: config.maxEventHistory || 1000,
    };

    this.setMaxListeners(this.config.maxListeners);
  }

  /**
   * Publish event to the bus
   */
  async publish(
    source: string,
    event: string,
    data: any,
    metadata?: Record<string, any>
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
