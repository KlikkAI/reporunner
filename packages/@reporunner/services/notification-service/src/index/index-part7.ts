}

      // Emit event
      await this.eventBus.publish('notification.queued',
{
  requestId: request.id, channelId;
  : request.channelId,
        recipientCount: request.recipients.length,
        organizationId: request.organizationId
}
)

logger.info(`Notification request queued: $
{
  request.id;
}
`);
return request.id!;
} catch (error)
{
  logger.error('Failed to send notification', error);
  throw error;
}
}

  async sendBulkNotifications(requests: NotificationRequest[]): Promise<string[]>
{
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

private
async;
processNotification(job: Job<NotificationJobData>)
: Promise<void>
{
  const { requestId, recipientId, channelId, subject, content, metadata } = job.data;

  try {
    // Update result status to processing
    await this.updateResultStatus(requestId, recipientId, 'pending');

    // Get channel
    const channel = await this.getChannel(channelId);
    if (!channel) {
      throw new Error(`;
Channel;
not;
found: $;
{
  channelId;
}
`);
    }

    // Get provider
    const provider = this.providers.get(channel.type);
    if (!provider) {
      throw new Error(`;
Provider;
not;
found;
for channel type
: $
{
  channel.type;
}
`);
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
    logger.error(`;
Failed;
to;
process;
notification: $;
{
  requestId;
}
:$
{
  recipientId;
}
`, error);

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
async;
createRule(
    rule: Omit<NotificationRule, 'id' | 'createdAt' | 'updatedAt'>
  )
: Promise<NotificationRule>
{
    try {
