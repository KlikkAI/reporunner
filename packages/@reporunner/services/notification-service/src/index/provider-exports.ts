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
