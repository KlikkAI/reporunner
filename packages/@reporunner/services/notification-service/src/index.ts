import type { DistributedEventBus } from '@reporunner/platform/event-bus';
import { logger } from '@reporunner/shared/logger';
import { type Job, Queue, Worker } from 'bullmq';
import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import type { Collection, Db, MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

export interface NotificationConfig {
  mongodb: {
    uri: string;
    database: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  queue: {
    maxConcurrentJobs: number;
    retryAttempts: number;
    backoffDelay: number;
  };
  providers: {
    email?: {
      provider: 'smtp' | 'sendgrid' | 'ses' | 'mailgun';
      config: Record<string, any>;
    };
    sms?: {
      provider: 'twilio' | 'nexmo' | 'sns';
      config: Record<string, any>;
    };
    slack?: {
      webhook?: string;
      token?: string;
    };
    teams?: {
      webhook?: string;
    };
    discord?: {
      webhook?: string;
    };
    webhook?: {
      defaultHeaders?: Record<string, string>;
    };
  };
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'slack' | 'discord' | 'webhook' | 'push' | 'teams' | 'in_app';
  organizationId: string;
  config: ChannelConfig;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  rateLimit?: {
    maxPerHour: number;
    maxPerDay: number;
  };
}

export interface ChannelConfig {
  // Email config
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  sendgrid?: {
    apiKey: string;
    fromEmail: string;
  };
  ses?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };

  // SMS config
  twilio?: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };

  // Chat/Webhook config
  webhook?: {
    url: string;
    headers?: Record<string, string>;
    method?: 'POST' | 'PUT';
  };
  slack?: {
    webhook?: string;
    token?: string;
    channel?: string;
  };
  teams?: {
    webhook: string;
  };
  discord?: {
    webhook: string;
  };
}

export interface NotificationTemplate {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  channelType: NotificationChannel['type'];
  subject?: string; // For email/push notifications
  template: string; // Template content with variables
  variables: TemplateVariable[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object';
  required: boolean;
  defaultValue?: any;
  description?: string;
}

export interface NotificationRequest {
  id?: string;
  channelId: string;
  templateId?: string;
  recipients: NotificationRecipient[];
  subject?: string;
  content?: string; // Raw content if no template
  variables?: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduledAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  deduplicationId?: string; // Prevent duplicate notifications
  organizationId: string;
  triggeredBy?: string;
  correlationId?: string;
}

export interface NotificationRecipient {
  id: string;
  type: 'user' | 'email' | 'phone' | 'webhook' | 'channel';
  value: string; // email, phone, webhook URL, etc.
  name?: string;
  metadata?: Record<string, any>;
}

export interface NotificationResult {
  id: string;
  requestId: string;
  recipientId: string;
  channelId: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled' | 'expired';
  createdAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  error?: NotificationError;
  attempts: number;
  maxAttempts: number;
  metadata?: Record<string, any>;
  response?: {
    statusCode?: number;
    body?: any;
    headers?: Record<string, string>;
  };
}

export interface NotificationError {
  code: string;
  message: string;
  details?: Record<string, any>;
  retryable: boolean;
}

export interface NotificationJobData {
  requestId: string;
  recipientId: string;
  channelId: string;
  subject?: string;
  content: string;
  metadata?: Record<string, any>;
  attempt: number;
}

export interface NotificationRule {
  id: string;
  name: string;
  organizationId: string;
  eventTypes: string[]; // Which events trigger this rule
  conditions: NotificationCondition[];
  actions: NotificationAction[];
  enabled: boolean;
  priority: number;
  cooldown?: number; // Minimum time between notifications in seconds
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'nin' | 'contains' | 'matches';
  value: any;
}

export interface NotificationAction {
  channelId: string;
  templateId: string;
  recipients: string[]; // User IDs or static recipients
  variables?: Record<string, any>;
  priority: NotificationRequest['priority'];
}

export class NotificationService extends EventEmitter {
  private db: Db;
  private cache: Redis;
  private channels: Collection<NotificationChannel>;
  private templates: Collection<NotificationTemplate>;
  private requests: Collection<NotificationRequest>;
  private results: Collection<NotificationResult>;
  private rules: Collection<NotificationRule>;
  private eventBus: DistributedEventBus;

  private notificationQueue: Queue<NotificationJobData>;
  private notificationWorker: Worker<NotificationJobData>;
  private providers: Map<string, NotificationProvider> = new Map();

  constructor(
    private config: NotificationConfig,
    private mongoClient: MongoClient,
    eventBus: DistributedEventBus
  ) {
    super();
    this.eventBus = eventBus;
    this.cache = new Redis(config.redis);
    this.db = mongoClient.db(config.mongodb.database);

    // Initialize collections
    this.channels = this.db.collection<NotificationChannel>('notification_channels');
    this.templates = this.db.collection<NotificationTemplate>('notification_templates');
    this.requests = this.db.collection<NotificationRequest>('notification_requests');
    this.results = this.db.collection<NotificationResult>('notification_results');
    this.rules = this.db.collection<NotificationRule>('notification_rules');

    // Initialize queue
    this.notificationQueue = new Queue<NotificationJobData>('notification-processing', {
      connection: config.redis,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100,
        attempts: config.queue.retryAttempts,
        backoff: {
          type: 'exponential',
          delay: config.queue.backoffDelay,
        },
      },
    });

    this.notificationWorker = new Worker<NotificationJobData>(
      'notification-processing',
      this.processNotification.bind(this),
      {
        connection: config.redis,
        concurrency: config.queue.maxConcurrentJobs,
      }
    );

    this.initializeIndexes();
    this.setupWorkerEvents();
    this.setupEventSubscriptions();
    this.initializeProviders();
  }

  private async initializeIndexes(): Promise<void> {
    try {
      // Channels indexes
      await this.channels.createIndex({ organizationId: 1, type: 1 });
      await this.channels.createIndex({ enabled: 1 });

      // Templates indexes
      await this.templates.createIndex({ organizationId: 1, channelType: 1 });
      await this.templates.createIndex({ isDefault: 1 });

      // Requests indexes
      await this.requests.createIndex({ organizationId: 1, createdAt: -1 });
      await this.requests.createIndex({ scheduledAt: 1 });
      await this.requests.createIndex({ deduplicationId: 1 });
      await this.requests.createIndex({ correlationId: 1 });

      // Results indexes
      await this.results.createIndex({ requestId: 1 });
      await this.results.createIndex({ status: 1, createdAt: -1 });
      await this.results.createIndex({ recipientId: 1, createdAt: -1 });

      // Rules indexes
      await this.rules.createIndex({ organizationId: 1, enabled: 1 });
      await this.rules.createIndex({ eventTypes: 1 });

      logger.info('Notification service indexes initialized');
    } catch (error) {
      logger.error('Failed to create notification indexes', error);
    }
  }

  private setupWorkerEvents(): void {
    this.notificationWorker.on('completed', async (job: Job<NotificationJobData>) => {
      logger.info(`Notification sent: ${job.data.requestId}:${job.data.recipientId}`);
    });

    this.notificationWorker.on('failed', async (job: Job<NotificationJobData>, error: Error) => {
      logger.error(`Notification failed: ${job?.data?.requestId}:${job?.data?.recipientId}`, error);
    });

    this.notificationWorker.on('stalled', (job: Job<NotificationJobData>) => {
      logger.warn(`Notification stalled: ${job.data.requestId}:${job.data.recipientId}`);
    });
  }

  private async setupEventSubscriptions(): Promise<void> {
    // Subscribe to all events to trigger notification rules
    await this.eventBus.subscribe('*', async (event) => {
      await this.processEventForRules(event);
    });

    // Subscribe to specific notification events
    await this.eventBus.subscribe('notification.*', async (event) => {
      await this.handleNotificationEvent(event);
    });
  }

  private initializeProviders(): void {
    // Initialize email providers
    if (this.config.providers.email) {
      this.providers.set('email', new EmailProvider(this.config.providers.email));
    }

    // Initialize SMS providers
    if (this.config.providers.sms) {
      this.providers.set('sms', new SMSProvider(this.config.providers.sms));
    }

    // Initialize chat providers
    if (this.config.providers.slack) {
      this.providers.set('slack', new SlackProvider(this.config.providers.slack));
    }

    if (this.config.providers.teams) {
      this.providers.set('teams', new TeamsProvider(this.config.providers.teams));
    }

    if (this.config.providers.discord) {
      this.providers.set('discord', new DiscordProvider(this.config.providers.discord));
    }

    // Initialize webhook provider
    this.providers.set('webhook', new WebhookProvider(this.config.providers.webhook || {}));

    // Initialize in-app provider
    this.providers.set('in_app', new InAppProvider(this.cache));
  }

  // Channel management
  async createChannel(
    channel: Omit<NotificationChannel, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<NotificationChannel> {
    try {
      const newChannel: NotificationChannel = {
        ...channel,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.channels.insertOne(newChannel);

      logger.info(`Notification channel created: ${newChannel.id}`);
      return newChannel;
    } catch (error) {
      logger.error('Failed to create notification channel', error);
      throw error;
    }
  }

  async updateChannel(
    id: string,
    updates: Partial<Omit<NotificationChannel, 'id' | 'createdAt'>>
  ): Promise<NotificationChannel | null> {
    try {
      const result = await this.channels.findOneAndUpdate(
        { id },
        {
          $set: {
            ...updates,
            updatedAt: new Date(),
          },
        },
        { returnDocument: 'after' }
      );

      if (result.value) {
        logger.info(`Notification channel updated: ${id}`);
      }

      return result.value;
    } catch (error) {
      logger.error(`Failed to update notification channel: ${id}`, error);
      throw error;
    }
  }

  async deleteChannel(id: string): Promise<boolean> {
    try {
      const result = await this.channels.deleteOne({ id });

      if (result.deletedCount > 0) {
        logger.info(`Notification channel deleted: ${id}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error(`Failed to delete notification channel: ${id}`, error);
      return false;
    }
  }

  async getChannel(id: string): Promise<NotificationChannel | null> {
    return await this.channels.findOne({ id });
  }

  async listChannels(
    organizationId: string,
    filters?: {
      type?: NotificationChannel['type'];
      enabled?: boolean;
      tags?: string[];
    }
  ): Promise<NotificationChannel[]> {
    const query: any = { organizationId };

    if (filters?.type) query.type = filters.type;
    if (filters?.enabled !== undefined) query.enabled = filters.enabled;
    if (filters?.tags?.length) query.tags = { $in: filters.tags };

    return await this.channels.find(query).sort({ createdAt: -1 }).toArray();
  }

  // Template management
  async createTemplate(
    template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<NotificationTemplate> {
    try {
      const newTemplate: NotificationTemplate = {
        ...template,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Validate template syntax
      this.validateTemplate(newTemplate);

      await this.templates.insertOne(newTemplate);

      logger.info(`Notification template created: ${newTemplate.id}`);
      return newTemplate;
    } catch (error) {
      logger.error('Failed to create notification template', error);
      throw error;
    }
  }

  async getTemplate(id: string): Promise<NotificationTemplate | null> {
    return await this.templates.findOne({ id });
  }

  async listTemplates(
    organizationId: string,
    channelType?: NotificationChannel['type']
  ): Promise<NotificationTemplate[]> {
    const query: any = { organizationId };
    if (channelType) query.channelType = channelType;

    return await this.templates.find(query).sort({ createdAt: -1 }).toArray();
  }

  // Notification sending
  async sendNotification(request: NotificationRequest): Promise<string> {
    try {
      // Generate request ID if not provided
      if (!request.id) {
        request.id = uuidv4();
      }

      // Check for deduplication
      if (request.deduplicationId) {
        const existing = await this.requests.findOne({
          deduplicationId: request.deduplicationId,
          organizationId: request.organizationId,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
        });

        if (existing) {
          logger.info(`Duplicate notification request ignored: ${request.deduplicationId}`);
          return existing.id!;
        }
      }

      // Validate channel exists
      const channel = await this.getChannel(request.channelId);
      if (!channel) {
        throw new Error(`Channel not found: ${request.channelId}`);
      }

      if (!channel.enabled) {
        throw new Error(`Channel disabled: ${request.channelId}`);
      }

      // Process template if provided
      let content = request.content || '';
      let subject = request.subject;

      if (request.templateId) {
        const template = await this.getTemplate(request.templateId);
        if (!template) {
          throw new Error(`Template not found: ${request.templateId}`);
        }

        content = this.renderTemplate(template.template, request.variables || {});
        if (template.subject) {
          subject = this.renderTemplate(template.subject, request.variables || {});
        }
      }

      // Save request
      const notificationRequest: NotificationRequest = {
        ...request,
        createdAt: new Date(),
      } as NotificationRequest;

      await this.requests.insertOne(notificationRequest);

      // Create jobs for each recipient
      for (const recipient of request.recipients) {
        const jobData: NotificationJobData = {
          requestId: request.id!,
          recipientId: recipient.id,
          channelId: request.channelId,
          subject,
          content,
          metadata: {
            recipient,
            ...request.metadata,
          },
          attempt: 1,
        };

        // Schedule or send immediately
        const delay = request.scheduledAt
          ? Math.max(0, request.scheduledAt.getTime() - Date.now())
          : 0;

        await this.notificationQueue.add('send-notification', jobData, {
          delay,
          priority: this.getPriorityWeight(request.priority),
          jobId: `${request.id}:${recipient.id}`,
        });

        // Create result record
        const result: NotificationResult = {
          id: uuidv4(),
          requestId: request.id!,
          recipientId: recipient.id,
          channelId: request.channelId,
          status: delay > 0 ? 'pending' : 'pending',
          createdAt: new Date(),
          attempts: 0,
          maxAttempts: this.config.queue.retryAttempts,
        };

        await this.results.insertOne(result);
      }

      // Emit event
      await this.eventBus.publish('notification.queued', {
        requestId: request.id,
        channelId: request.channelId,
        recipientCount: request.recipients.length,
        organizationId: request.organizationId,
      });

      logger.info(`Notification request queued: ${request.id}`);
      return request.id!;
    } catch (error) {
      logger.error('Failed to send notification', error);
      throw error;
    }
  }

  async sendBulkNotifications(requests: NotificationRequest[]): Promise<string[]> {
    const requestIds: string[] = [];

    for (const request of requests) {
      try {
        const requestId = await this.sendNotification(request);
        requestIds.push(requestId);
      } catch (error) {
        logger.error('Failed to send bulk notification', error);
        // Continue with other notifications
      }
    }

    return requestIds;
  }

  private async processNotification(job: Job<NotificationJobData>): Promise<void> {
    const { requestId, recipientId, channelId, subject, content, metadata } = job.data;

    try {
      // Update result status to processing
      await this.updateResultStatus(requestId, recipientId, 'pending');

      // Get channel
      const channel = await this.getChannel(channelId);
      if (!channel) {
        throw new Error(`Channel not found: ${channelId}`);
      }

      // Get provider
      const provider = this.providers.get(channel.type);
      if (!provider) {
        throw new Error(`Provider not found for channel type: ${channel.type}`);
      }

      // Send notification
      const response = await provider.send({
        channel,
        recipient: metadata.recipient,
        subject,
        content,
        metadata,
      });

      // Update result with success
      await this.updateResultWithResponse(requestId, recipientId, 'sent', response);

      // Emit success event
      await this.eventBus.publish('notification.sent', {
        requestId,
        recipientId,
        channelId,
        response,
      });
    } catch (error) {
      logger.error(`Failed to process notification: ${requestId}:${recipientId}`, error);

      // Update result with error
      await this.updateResultWithError(requestId, recipientId, 'failed', {
        code: 'SEND_FAILED',
        message: (error as Error).message,
        retryable: this.isRetryableError(error as Error),
      });

      // Emit failure event
      await this.eventBus.publish('notification.failed', {
        requestId,
        recipientId,
        channelId,
        error: (error as Error).message,
      });

      throw error;
    }
  }

  // Rule-based notifications
  async createRule(
    rule: Omit<NotificationRule, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<NotificationRule> {
    try {
      const newRule: NotificationRule = {
        ...rule,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.rules.insertOne(newRule);

      logger.info(`Notification rule created: ${newRule.id}`);
      return newRule;
    } catch (error) {
      logger.error('Failed to create notification rule', error);
      throw error;
    }
  }

  async listRules(organizationId: string): Promise<NotificationRule[]> {
    return await this.rules.find({ organizationId }).sort({ priority: -1 }).toArray();
  }

  private async processEventForRules(event: any): Promise<void> {
    try {
      const rules = await this.rules
        .find({
          enabled: true,
          eventTypes: event.type,
        })
        .sort({ priority: -1 })
        .toArray();

      for (const rule of rules) {
        try {
          if (await this.evaluateRuleConditions(rule, event)) {
            await this.executeRuleActions(rule, event);
          }
        } catch (error) {
          logger.error(`Failed to process rule: ${rule.id}`, error);
        }
      }
    } catch (error) {
      logger.error('Failed to process event for rules', error);
    }
  }

  private async evaluateRuleConditions(rule: NotificationRule, event: any): Promise<boolean> {
    if (rule.conditions.length === 0) return true;

    for (const condition of rule.conditions) {
      const eventValue = this.getNestedValue(event, condition.field);

      if (!this.evaluateCondition(eventValue, condition.operator, condition.value)) {
        return false;
      }
    }

    return true;
  }

  private async executeRuleActions(rule: NotificationRule, event: any): Promise<void> {
    for (const action of rule.actions) {
      try {
        // Build notification request from rule action
        const request: NotificationRequest = {
          channelId: action.channelId,
          templateId: action.templateId,
          recipients: await this.resolveRecipients(action.recipients, event),
          variables: {
            ...action.variables,
            event: event.data,
            eventType: event.type,
            timestamp: event.timestamp,
          },
          priority: action.priority,
          organizationId: rule.organizationId,
          triggeredBy: 'rule',
          correlationId: event.correlationId,
          metadata: {
            ruleId: rule.id,
            ruleName: rule.name,
          },
        };

        await this.sendNotification(request);
      } catch (error) {
        logger.error(`Failed to execute rule action: ${rule.id}`, error);
      }
    }
  }

  // Utility methods
  private validateTemplate(template: NotificationTemplate): void {
    // Basic template validation
    if (!template.template.trim()) {
      throw new Error('Template content cannot be empty');
    }

    // Check for undefined variables
    const variablePattern = /\{\{(\w+)\}\}/g;
    const matches = [...template.template.matchAll(variablePattern)];
    const usedVariables = matches.map((match) => match[1]);
    const definedVariables = template.variables.map((v) => v.name);

    const undefinedVars = usedVariables.filter((v) => !definedVariables.includes(v));
    if (undefinedVars.length > 0) {
      throw new Error(`Undefined variables in template: ${undefinedVars.join(', ')}`);
    }
  }

  private renderTemplate(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName]?.toString() || match;
    });
  }

  private getPriorityWeight(priority: NotificationRequest['priority']): number {
    const weights = { low: 1, normal: 5, high: 10, urgent: 20 };
    return weights[priority];
  }

  private isRetryableError(error: Error): boolean {
    const retryableErrors = [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'RATE_LIMITED',
      'SERVER_ERROR',
    ];

    return retryableErrors.some(
      (code) => error.message.includes(code) || error.name.includes(code)
    );
  }

  private async updateResultStatus(
    requestId: string,
    recipientId: string,
    status: NotificationResult['status']
  ): Promise<void> {
    const update: any = { status };

    if (status === 'sent') update.sentAt = new Date();
    if (status === 'delivered') update.deliveredAt = new Date();
    if (status === 'failed') update.failedAt = new Date();

    await this.results.updateOne(
      { requestId, recipientId },
      {
        $set: update,
        $inc: { attempts: 1 },
      }
    );
  }

  private async updateResultWithResponse(
    requestId: string,
    recipientId: string,
    status: NotificationResult['status'],
    response: any
  ): Promise<void> {
    await this.results.updateOne(
      { requestId, recipientId },
      {
        $set: {
          status,
          sentAt: new Date(),
          response,
        },
        $inc: { attempts: 1 },
      }
    );
  }

  private async updateResultWithError(
    requestId: string,
    recipientId: string,
    status: NotificationResult['status'],
    error: NotificationError
  ): Promise<void> {
    await this.results.updateOne(
      { requestId, recipientId },
      {
        $set: {
          status,
          failedAt: new Date(),
          error,
        },
        $inc: { attempts: 1 },
      }
    );
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private evaluateCondition(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'eq':
        return actual === expected;
      case 'neq':
        return actual !== expected;
      case 'gt':
        return actual > expected;
      case 'lt':
        return actual < expected;
      case 'gte':
        return actual >= expected;
      case 'lte':
        return actual <= expected;
      case 'in':
        return Array.isArray(expected) && expected.includes(actual);
      case 'nin':
        return Array.isArray(expected) && !expected.includes(actual);
      case 'contains':
        return String(actual).includes(String(expected));
      case 'matches':
        return new RegExp(String(expected)).test(String(actual));
      default:
        return false;
    }
  }

  private async resolveRecipients(
    recipientIds: string[],
    event: any
  ): Promise<NotificationRecipient[]> {
    // This would typically resolve user IDs to actual notification recipients
    // For now, return simple recipients
    return recipientIds.map((id) => ({
      id,
      type: 'user' as const,
      value: id,
    }));
  }

  // Query methods
  async getNotificationResults(requestId: string): Promise<NotificationResult[]> {
    return await this.results.find({ requestId }).toArray();
  }

  async getNotificationHistory(
    organizationId: string,
    filters?: {
      channelId?: string;
      status?: NotificationResult['status'];
      startDate?: Date;
      endDate?: Date;
    },
    pagination?: {
      page: number;
      limit: number;
    }
  ): Promise<{
    results: NotificationResult[];
    total: number;
  }> {
    // Build query from request collection to include organizationId
    const requestQuery: any = { organizationId };

    if (filters?.channelId) requestQuery.channelId = filters.channelId;
    if (filters?.startDate || filters?.endDate) {
      requestQuery.createdAt = {};
      if (filters.startDate) requestQuery.createdAt.$gte = filters.startDate;
      if (filters.endDate) requestQuery.createdAt.$lte = filters.endDate;
    }

    // Get matching request IDs
    const requests = await this.requests.find(requestQuery, { projection: { id: 1 } }).toArray();
    const requestIds = requests.map((r) => r.id);

    // Build results query
    const resultsQuery: any = { requestId: { $in: requestIds } };
    if (filters?.status) resultsQuery.status = filters.status;

    // Apply pagination
    const skip = pagination ? (pagination.page - 1) * pagination.limit : 0;
    const limit = pagination?.limit || 50;

    const [results, total] = await Promise.all([
      this.results.find(resultsQuery).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      this.results.countDocuments(resultsQuery),
    ]);

    return { results, total };
  }

  // Event handlers
  private async handleNotificationEvent(event: any): Promise<void> {
    logger.debug('Handling notification event', event);
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    metrics: {
      queueSize: number;
      processing: number;
      sent24h: number;
      failed24h: number;
    };
  }> {
    try {
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [queueSize, sent24h, failed24h] = await Promise.all([
        this.notificationQueue.count(),
        this.results.countDocuments({ status: 'sent', sentAt: { $gte: last24h } }),
        this.results.countDocuments({ status: 'failed', failedAt: { $gte: last24h } }),
      ]);

      return {
        status: 'healthy',
        metrics: {
          queueSize,
          processing: 0, // Would need to track active jobs
          sent24h,
          failed24h,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        metrics: {
          queueSize: 0,
          processing: 0,
          sent24h: 0,
          failed24h: 0,
        },
      };
    }
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down notification service');

    await this.notificationWorker.close();
    await this.notificationQueue.close();
    await this.cache.quit();
  }
}

// Base notification provider interface
export interface NotificationProvider {
  send(params: {
    channel: NotificationChannel;
    recipient: NotificationRecipient;
    subject?: string;
    content: string;
    metadata?: Record<string, any>;
  }): Promise<any>;
}

// Provider implementations
class EmailProvider implements NotificationProvider {
  constructor(private config: any) {}

  async send(params: any): Promise<any> {
    // Implementation would use nodemailer, SendGrid, SES, etc.
    logger.info(`Sending email to ${params.recipient.value}`);
    return { messageId: `email-${Date.now()}` };
  }
}

class SMSProvider implements NotificationProvider {
  constructor(private config: any) {}

  async send(params: any): Promise<any> {
    // Implementation would use Twilio, AWS SNS, etc.
    logger.info(`Sending SMS to ${params.recipient.value}`);
    return { messageId: `sms-${Date.now()}` };
  }
}

class SlackProvider implements NotificationProvider {
  constructor(private config: any) {}

  async send(params: any): Promise<any> {
    // Implementation would use Slack API or webhooks
    logger.info(`Sending Slack message to ${params.recipient.value}`);
    return { messageId: `slack-${Date.now()}` };
  }
}

class TeamsProvider implements NotificationProvider {
  constructor(private config: any) {}

  async send(params: any): Promise<any> {
    // Implementation would use Microsoft Teams webhooks
    logger.info(`Sending Teams message to ${params.recipient.value}`);
    return { messageId: `teams-${Date.now()}` };
  }
}

class DiscordProvider implements NotificationProvider {
  constructor(private config: any) {}

  async send(params: any): Promise<any> {
    // Implementation would use Discord webhooks
    logger.info(`Sending Discord message to ${params.recipient.value}`);
    return { messageId: `discord-${Date.now()}` };
  }
}

class WebhookProvider implements NotificationProvider {
  constructor(private config: any) {}

  async send(params: any): Promise<any> {
    // Implementation would make HTTP requests to webhooks
    logger.info(`Sending webhook to ${params.recipient.value}`);
    return { statusCode: 200 };
  }
}

class InAppProvider implements NotificationProvider {
  constructor(private cache: Redis) {}

  async send(params: any): Promise<any> {
    // Store in-app notification in cache/database
    const notification = {
      id: uuidv4(),
      recipient: params.recipient.value,
      subject: params.subject,
      content: params.content,
      timestamp: new Date(),
      read: false,
    };

    await this.cache.lpush(`notifications:${params.recipient.value}`, JSON.stringify(notification));

    logger.info(`Storing in-app notification for ${params.recipient.value}`);
    return { notificationId: notification.id };
  }
}

export * from './channels';
export * from './queue';
export * from './templates';
