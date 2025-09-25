import { Redis } from 'ioredis';
import { EventEmitter } from 'events';
import { logger } from '@reporunner/shared/logger';
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

export interface EventHandler {
  (event: Event): Promise<void>;
}

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
