}
      }
    })

await Promise.all(promises)
}

  private async processEvent(
    event: Event,
    subscription: Subscription
  ): Promise<void>
{
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

private
matchesPattern(eventType: string, pattern: string)
: boolean
{
  if (pattern === '*') return true;
  if (pattern === eventType) return true;

  // Support wildcard patterns like "workflow.*"
  if (pattern.endsWith('*')) {
    const prefix = pattern.slice(0, -1);
    return eventType.startsWith(prefix);
  }

  return false;
}

private
trackProcessing(key: string, timeout?: number)
: void
{
  if (!timeout) return;

  const timer = setTimeout(() => {
    logger.warn(`Processing timeout for ${key}`);
    this.emit('processing.timeout', { key });
  }, timeout);

  this.processingEvents.set(key, timer);
}

private
clearProcessing(key: string)
: void
{
  const timer = this.processingEvents.get(key);
  if (timer) {
    clearTimeout(timer);
    this.processingEvents.delete(key);
  }
}

private
async;
retryMessage(
    consumer: Redis,
    streamKey: string,
    messageId: string,
    subscription: Subscription,
    error: any
  )
: Promise<void>
{
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
