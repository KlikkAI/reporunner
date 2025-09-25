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
} catch (error)
{
  logger.error('Failed to create notification indexes', error);
}
}

  private setupWorkerEvents(): void
{
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

private
async;
setupEventSubscriptions();
: Promise<void>
{
  // Subscribe to all events to trigger notification rules
  await this.eventBus.subscribe('*', async (event) => {
    await this.processEventForRules(event);
  });

  // Subscribe to specific notification events
  await this.eventBus.subscribe('notification.*', async (event) => {
    await this.handleNotificationEvent(event);
  });
}

private
initializeProviders();
: void
{
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
async;
createChannel(
    channel: Omit<NotificationChannel, 'id' | 'createdAt' | 'updatedAt'>
  )
: Promise<NotificationChannel>
{
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

async;
updateChannel(
    id: string,
