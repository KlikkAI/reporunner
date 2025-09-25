this.isConnected = false;
this.emit('disconnected');
})
}

  async connect(): Promise<void>
{
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

async;
disconnect();
: Promise<void>
{
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

async;
publish(eventType: string, data: any, options?: {
    correlationId?: string;
metadata?: Record<string, any>;
stream?: string;
}): Promise<string>
{
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

async;
subscribe(
    pattern: string,
