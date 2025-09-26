import { logger } from '@reporunner/shared/logger';
import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

export interface EventBusConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
  };
  consumer: {
    group: string;
    name: string;
    blockTimeout: number;
  };
  streams: {
    maxLen: number;
    trimStrategy: 'MAXLEN' | 'MINID';
  };
  retry: {
    maxAttempts: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
}

export interface Event {
  id: string;
  type: string;
  timestamp: Date;
  source: string;
  correlationId?: string;
  metadata?: Record<string, any>;
  data: any;
}

export type EventHandler = (event: Event) => Promise<void>;

export interface Subscription {
  id: string;
  pattern: string;
  handler: EventHandler;
  options?: SubscriptionOptions;
}

export interface SubscriptionOptions {
  retryOnError?: boolean;
  maxRetries?: number;
  ackTimeout?: number;
  parallelism?: number;
}

export class DistributedEventBus extends EventEmitter {
  private publisher: Redis;
  private subscriber: Redis;
  private consumers: Map<string, Redis> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();
  private processingEvents: Map<string, NodeJS.Timeout> = new Map();
  private isConnected: boolean = false;
  private consumerGroup: string;
  private consumerName: string;
  private pollingIntervals: Map<string, NodeJS.Timer> = new Map();

  constructor(private config: EventBusConfig) {
    super();
    this.consumerGroup = config.consumer.group;
    this.consumerName = `${config.consumer.name}-${process.pid}`;
    this.publisher = new Redis(config.redis);
    this.subscriber = new Redis(config.redis);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.publisher.on('connect', () => {
      logger.info('Event bus publisher connected');
    });

    this.publisher.on('error', (error) => {
      logger.error('Event bus publisher error', error);
      this.emit('error', error);
    });

    this.subscriber.on('connect', () => {
      logger.info('Event bus subscriber connected');
      this.isConnected = true;
      this.emit('connected');
    });

    this.subscriber.on('error', (error) => {
      logger.error('Event bus subscriber error', error);
      this.emit('error', error);
    });

    this.subscriber.on('disconnect', () => {
      logger.warn('Event bus subscriber disconnected');
      this.isConnected = false;
      this.emit('disconnected');
    });
  }

  async connect(): Promise<void> {
    try {
      await this.publisher.ping();
      await this.subscriber.ping();
      this.isConnected = true;
      logger.info('Distributed event bus connected');
    } catch (error) {
      logger.error('Failed to connect to event bus', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      // Stop all polling
      for (const [, interval] of this.pollingIntervals) {
        clearInterval(interval);
      }
      this.pollingIntervals.clear();

      // Clear pending acknowledgments
      for (const [, timeout] of this.processingEvents) {
        clearTimeout(timeout);
      }
      this.processingEvents.clear();

      // Disconnect all consumers
      for (const [, consumer] of this.consumers) {
        await consumer.quit();
      }
      this.consumers.clear();

      // Disconnect publisher and subscriber
      await this.publisher.quit();
      await this.subscriber.quit();

      this.isConnected = false;
      logger.info('Distributed event bus disconnected');
    } catch (error) {
      logger.error('Error disconnecting from event bus', error);
      throw error;
    }
  }

  async publish(
    eventType: string,
    data: any,
    options?: {
      correlationId?: string;
      metadata?: Record<string, any>;
      stream?: string;
    }
  ): Promise<string> {
    if (!this.isConnected) {
      throw new Error('Event bus is not connected');
    }

    const event: Event = {
      id: uuidv4(),
      type: eventType,
      timestamp: new Date(),
      source: this.consumerName,
      correlationId: options?.correlationId || uuidv4(),
      metadata: options?.metadata,
      data,
    };

    const streamKey = options?.stream || this.getStreamKey(eventType);

    try {
      // Publish to Redis Stream
      const messageId = await this.publisher.xadd(
        streamKey,
        'MAXLEN',
        '~',
        this.config.streams.maxLen,
        '*',
        'event',
        JSON.stringify(event)
      );

      logger.info(`Event published: ${eventType}`, {
        eventId: event.id,
        streamKey,
        messageId,
        correlationId: event.correlationId,
      });

      // Emit local event for monitoring
      this.emit('event.published', event);

      return event.id;
    } catch (error) {
      logger.error(`Failed to publish event: ${eventType}`, error);
      throw error;
    }
  }

  async subscribe(
    pattern: string,
    handler: EventHandler,
    options?: SubscriptionOptions
  ): Promise<string> {
    const subscriptionId = uuidv4();
    const subscription: Subscription = {
      id: subscriptionId,
      pattern,
      handler,
      options,
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Create consumer group for the stream
    const streamKey = this.getStreamKey(pattern);
    await this.createConsumerGroup(streamKey);

    // Start consuming from the stream
    await this.startConsuming(streamKey, subscription);

    logger.info(`Subscribed to pattern: ${pattern}`, {
      subscriptionId,
      streamKey,
      consumerGroup: this.consumerGroup,
    });

    return subscriptionId;
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      logger.warn(`Subscription not found: ${subscriptionId}`);
      return;
    }

    this.subscriptions.delete(subscriptionId);

    // Stop polling if no more subscriptions for this pattern
    const streamKey = this.getStreamKey(subscription.pattern);
    const hasOtherSubscriptions = Array.from(this.subscriptions.values()).some(
      (sub) => this.getStreamKey(sub.pattern) === streamKey
    );

    if (!hasOtherSubscriptions) {
      const interval = this.pollingIntervals.get(streamKey);
      if (interval) {
        clearInterval(interval);
        this.pollingIntervals.delete(streamKey);
      }

      const consumer = this.consumers.get(streamKey);
      if (consumer) {
        await consumer.quit();
        this.consumers.delete(streamKey);
      }
    }

    logger.info(`Unsubscribed: ${subscriptionId}`);
  }

  private async createConsumerGroup(streamKey: string): Promise<void> {
    try {
      // Try to create consumer group, starting from the beginning
      await this.publisher.xgroup('CREATE', streamKey, this.consumerGroup, '$', 'MKSTREAM');
      logger.info(`Consumer group created: ${this.consumerGroup} for ${streamKey}`);
    } catch (error: any) {
      // Group already exists, which is fine
      if (!error.message.includes('BUSYGROUP')) {
        logger.error(`Failed to create consumer group for ${streamKey}`, error);
        throw error;
      }
    }
  }

  private async startConsuming(streamKey: string, subscription: Subscription): Promise<void> {
    // Create dedicated consumer connection
    if (!this.consumers.has(streamKey)) {
      const consumer = new Redis(this.config.redis);
      this.consumers.set(streamKey, consumer);
    }

    const consumer = this.consumers.get(streamKey)!;
    const parallelism = subscription.options?.parallelism || 1;

    // Start polling loop
    const pollInterval = setInterval(async () => {
      try {
        await this.consumeMessages(consumer, streamKey, subscription, parallelism);
      } catch (error) {
        logger.error(`Error consuming messages from ${streamKey}`, error);
      }
    }, 1000); // Poll every second

    this.pollingIntervals.set(streamKey, pollInterval);
  }

  private async consumeMessages(
    consumer: Redis,
    streamKey: string,
    subscription: Subscription,
    parallelism: number
  ): Promise<void> {
    try {
      // Read pending messages first
      const pendingMessages = await consumer.xreadgroup(
        'GROUP',
        this.consumerGroup,
        this.consumerName,
        'COUNT',
        parallelism,
        'STREAMS',
        streamKey,
        '0'
      );

      if (pendingMessages && pendingMessages.length > 0) {
        await this.processMessages(consumer, streamKey, pendingMessages[0][1], subscription);
      }

      // Read new messages
      const newMessages = await consumer.xreadgroup(
        'GROUP',
        this.consumerGroup,
        this.consumerName,
        'BLOCK',
        this.config.consumer.blockTimeout,
        'COUNT',
        parallelism,
        'STREAMS',
        streamKey,
        '>'
      );

      if (newMessages && newMessages.length > 0) {
        await this.processMessages(consumer, streamKey, newMessages[0][1], subscription);
      }
    } catch (error) {
      logger.error(`Failed to consume messages from ${streamKey}`, error);
      throw error;
    }
  }

  private async processMessages(
    consumer: Redis,
    streamKey: string,
    messages: any[],
    subscription: Subscription
  ): Promise<void> {
    const promises = messages.map(async ([messageId, fields]) => {
      try {
        // Parse event from message
        const eventData = fields.find((f: any, i: number) => i % 2 === 0 && f === 'event');
        const eventValue = fields[fields.indexOf(eventData) + 1];
        const event = JSON.parse(eventValue) as Event;

        // Check if event matches subscription pattern
        if (this.matchesPattern(event.type, subscription.pattern)) {
          // Track processing
          const processingKey = `${streamKey}:${messageId}`;
          this.trackProcessing(processingKey, subscription.options?.ackTimeout);

          // Process event
          await this.processEvent(event, subscription);

          // Acknowledge message
          await consumer.xack(streamKey, this.consumerGroup, messageId);
          this.clearProcessing(processingKey);

          logger.debug(`Message acknowledged: ${messageId}`);
        } else {
          // Skip non-matching events
          await consumer.xack(streamKey, this.consumerGroup, messageId);
        }
      } catch (error) {
        logger.error(`Failed to process message: ${messageId}`, error);

        // Retry logic
        if (subscription.options?.retryOnError) {
          await this.retryMessage(consumer, streamKey, messageId, subscription, error);
        } else {
          // Move to dead letter queue
          await this.moveToDeadLetter(streamKey, messageId, error);
          await consumer.xack(streamKey, this.consumerGroup, messageId);
        }
      }
    });

    await Promise.all(promises);
  }

  private async processEvent(event: Event, subscription: Subscription): Promise<void> {
    const startTime = Date.now();

    try {
      await subscription.handler(event);

      const duration = Date.now() - startTime;
      logger.debug(`Event processed: ${event.type}`, {
        eventId: event.id,
        duration,
        subscriptionId: subscription.id,
      });

      // Emit metrics
      this.emit('event.processed', {
        event,
        subscription: subscription.id,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Event handler error: ${event.type}`, {
        eventId: event.id,
        error,
        duration,
      });

      // Emit error metrics
      this.emit('event.failed', {
        event,
        subscription: subscription.id,
        error,
        duration,
      });

      throw error;
    }
  }

  private matchesPattern(eventType: string, pattern: string): boolean {
    if (pattern === '*') return true;
    if (pattern === eventType) return true;

    // Support wildcard patterns like "workflow.*"
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return eventType.startsWith(prefix);
    }

    return false;
  }

  private trackProcessing(key: string, timeout?: number): void {
    if (!timeout) return;

    const timer = setTimeout(() => {
      logger.warn(`Processing timeout for ${key}`);
      this.emit('processing.timeout', { key });
    }, timeout);

    this.processingEvents.set(key, timer);
  }

  private clearProcessing(key: string): void {
    const timer = this.processingEvents.get(key);
    if (timer) {
      clearTimeout(timer);
      this.processingEvents.delete(key);
    }
  }

  private async retryMessage(
    consumer: Redis,
    streamKey: string,
    messageId: string,
    subscription: Subscription,
    error: any
  ): Promise<void> {
    const maxRetries = subscription.options?.maxRetries || this.config.retry.maxAttempts;

    // Get retry count from stream
    const retryKey = `${streamKey}:retry:${messageId}`;
    const retryCount = await this.publisher.incr(retryKey);
    await this.publisher.expire(retryKey, 86400); // Expire after 1 day

    if (retryCount > maxRetries) {
      logger.error(`Max retries exceeded for message: ${messageId}`);
      await this.moveToDeadLetter(streamKey, messageId, error);
      await consumer.xack(streamKey, this.consumerGroup, messageId);
      return;
    }

    // Calculate backoff delay
    const delay = this.calculateBackoff(retryCount);

    logger.info(`Retrying message: ${messageId}`, {
      retryCount,
      maxRetries,
      delay,
    });

    // Re-deliver message after delay
    setTimeout(async () => {
      try {
        // Claim the message for re-processing
        await consumer.xclaim(streamKey, this.consumerGroup, this.consumerName, 0, messageId);
      } catch (claimError) {
        logger.error(`Failed to claim message for retry: ${messageId}`, claimError);
      }
    }, delay);
  }

  private calculateBackoff(attempt: number): number {
    const { initialDelay, backoffMultiplier } = this.config.retry;
    return Math.min(
      initialDelay * backoffMultiplier ** (attempt - 1),
      60000 // Max 1 minute
    );
  }

  private async moveToDeadLetter(streamKey: string, messageId: string, error: any): Promise<void> {
    const dlqKey = `${streamKey}:dlq`;

    try {
      await this.publisher.xadd(
        dlqKey,
        '*',
        'originalStream',
        streamKey,
        'originalMessageId',
        messageId,
        'error',
        JSON.stringify({
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        })
      );

      logger.info(`Message moved to DLQ: ${messageId}`);
    } catch (dlqError) {
      logger.error(`Failed to move message to DLQ: ${messageId}`, dlqError);
    }
  }

  private getStreamKey(pattern: string): string {
    const prefix = this.config.redis.keyPrefix || 'events';
    return `${prefix}:${pattern.replace(/\*/g, 'all')}`;
  }

  // Utility methods for monitoring and management
  async getStreamInfo(pattern: string): Promise<any> {
    const streamKey = this.getStreamKey(pattern);
    return await this.publisher.xinfo('STREAM', streamKey);
  }

  async getConsumerGroupInfo(pattern: string): Promise<any> {
    const streamKey = this.getStreamKey(pattern);
    return await this.publisher.xinfo('GROUPS', streamKey);
  }

  async getPendingMessages(pattern: string): Promise<any> {
    const streamKey = this.getStreamKey(pattern);
    return await this.publisher.xpending(streamKey, this.consumerGroup);
  }

  async getDeadLetterQueue(pattern: string): Promise<any[]> {
    const streamKey = this.getStreamKey(pattern);
    const dlqKey = `${streamKey}:dlq`;
    const messages = await this.publisher.xrange(dlqKey, '-', '+');
    return messages.map(([id, fields]) => ({
      id,
      data: this.parseStreamFields(fields),
    }));
  }

  private parseStreamFields(fields: any[]): Record<string, any> {
    const result: Record<string, any> = {};
    for (let i = 0; i < fields.length; i += 2) {
      result[fields[i]] = fields[i + 1];
    }
    return result;
  }

  async reprocessDeadLetter(pattern: string, messageId: string): Promise<void> {
    const streamKey = this.getStreamKey(pattern);
    const dlqKey = `${streamKey}:dlq`;

    try {
      // Get message from DLQ
      const messages = await this.publisher.xrange(dlqKey, messageId, messageId);
      if (messages.length === 0) {
        throw new Error(`Message not found in DLQ: ${messageId}`);
      }

      const [, fields] = messages[0];
      const data = this.parseStreamFields(fields);

      // Re-publish to original stream
      await this.publisher.xadd(
        streamKey,
        '*',
        'event',
        data.event,
        'reprocessed',
        'true',
        'originalMessageId',
        messageId
      );

      // Remove from DLQ
      await this.publisher.xdel(dlqKey, messageId);

      logger.info(`Message reprocessed from DLQ: ${messageId}`);
    } catch (error) {
      logger.error(`Failed to reprocess DLQ message: ${messageId}`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<{
    connected: boolean;
    subscriptions: number;
    consumers: number;
    processingEvents: number;
  }> {
    return {
      connected: this.isConnected,
      subscriptions: this.subscriptions.size,
      consumers: this.consumers.size,
      processingEvents: this.processingEvents.size,
    };
  }
}

export default DistributedEventBus;
