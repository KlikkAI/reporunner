handler: EventHandler,
    options?: SubscriptionOptions
): Promise<string>
{
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

async;
unsubscribe(subscriptionId: string)
: Promise<void>
{
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

private
async;
createConsumerGroup(streamKey: string)
: Promise<void>
{
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

private
async;
startConsuming(
    streamKey: string,
    subscription: Subscription
  )
: Promise<void>
{
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
