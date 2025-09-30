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
  private channels: Collection<NotificationChannel>;
  private templates: Collection<NotificationTemplate>;
  private requests: Collection<NotificationRequest>;

  constructor(config: NotificationConfig,mongoClient: MongoClient,
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
