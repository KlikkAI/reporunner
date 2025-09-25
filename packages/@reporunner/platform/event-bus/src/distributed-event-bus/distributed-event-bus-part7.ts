}
return result;
}

  async reprocessDeadLetter(pattern: string, messageId: string): Promise<void>
{
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
async;
healthCheck();
: Promise<
{
  connected: boolean;
  subscriptions: number;
  consumers: number;
  processingEvents: number;
}
>
{
  return {
      connected: this.isConnected,
      subscriptions: this.subscriptions.size,
      consumers: this.consumers.size,
      processingEvents: this.processingEvents.size
    };
}
}

export default DistributedEventBus;
