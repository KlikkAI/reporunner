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

  private calculateBackoff(attempt: number): number
{
  const { initialDelay, backoffMultiplier } = this.config.retry;
  return Math.min(
      initialDelay * Math.pow(backoffMultiplier, attempt - 1),
      60000 // Max 1 minute
    );
}

private
async;
moveToDeadLetter(
    streamKey: string,
    messageId: string,
    error: any
  )
: Promise<void>
{
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

private
getStreamKey(pattern: string)
: string
{
  const prefix = this.config.redis.keyPrefix || 'events';
  return `${prefix}:${pattern.replace(/\*/g, 'all')}`;
}

// Utility methods for monitoring and management
async;
getStreamInfo(pattern: string)
: Promise<any>
{
  const streamKey = this.getStreamKey(pattern);
  return await this.publisher.xinfo('STREAM', streamKey);
}

async;
getConsumerGroupInfo(pattern: string)
: Promise<any>
{
  const streamKey = this.getStreamKey(pattern);
  return await this.publisher.xinfo('GROUPS', streamKey);
}

async;
getPendingMessages(pattern: string)
: Promise<any>
{
  const streamKey = this.getStreamKey(pattern);
  return await this.publisher.xpending(
      streamKey,
      this.consumerGroup
    );
}

async;
getDeadLetterQueue(pattern: string)
: Promise<any[]>
{
  const streamKey = this.getStreamKey(pattern);
  const dlqKey = `${streamKey}:dlq`;
  const messages = await this.publisher.xrange(dlqKey, '-', '+');
  return messages.map(([id, fields]) => ({
      id,
      data: this.parseStreamFields(fields)
    }));
}

private
parseStreamFields(fields: any[])
: Record<string, any>
{
    const result: Record<string, any> = {};
    for (let i = 0; i < fields.length; i += 2) {
      result[fields[i]] = fields[i + 1];
