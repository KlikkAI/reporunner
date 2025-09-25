}, 1000) // Poll every second

this.pollingIntervals.set(streamKey, pollInterval)
}

  private async consumeMessages(
    consumer: Redis,
    streamKey: string,
    subscription: Subscription,
    parallelism: number
  ): Promise<void>
{
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

private
async;
processMessages(
    consumer: Redis,
    streamKey: string,
    messages: any[],
    subscription: Subscription
  )
: Promise<void>
{
    const promises = messages.map(async ([messageId, fields]) => {
      try {
        // Parse event from message
        const eventData = fields.find((f: any, i: number) => 
          i % 2 === 0 && f === 'event'
        );
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
          await this.retryMessage(
            consumer,
            streamKey,
            messageId,
            subscription,
            error
          );
        } else {
          // Move to dead letter queue
          await this.moveToDeadLetter(streamKey, messageId, error);
          await consumer.xack(streamKey, this.consumerGroup, messageId);
