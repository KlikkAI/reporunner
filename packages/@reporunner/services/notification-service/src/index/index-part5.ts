updates: Partial<Omit<NotificationChannel, 'id' | 'createdAt'>>;
): Promise<NotificationChannel | null>
{
  try {
    const result = await this.channels.findOneAndUpdate(
      { id },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    if (result.value) {
      logger.info(`Notification channel updated: ${id}`);
    }

    return result.value;
  } catch (error) {
    logger.error(`Failed to update notification channel: ${id}`, error);
    throw error;
  }
}

async;
deleteChannel(id: string)
: Promise<boolean>
{
  try {
    const result = await this.channels.deleteOne({ id });

    if (result.deletedCount > 0) {
      logger.info(`Notification channel deleted: ${id}`);
      return true;
    }

    return false;
  } catch (error) {
    logger.error(`Failed to delete notification channel: ${id}`, error);
    return false;
  }
}

async;
getChannel(id: string)
: Promise<NotificationChannel | null>
{
  return await this.channels.findOne({ id });
}

async;
listChannels(
    organizationId: string,
    filters?: {
      type?: NotificationChannel['type'];
enabled?: boolean;
tags?: string[];
}
  ): Promise<NotificationChannel[]>
{
  const query: any = { organizationId };

  if (filters?.type) query.type = filters.type;
  if (filters?.enabled !== undefined) query.enabled = filters.enabled;
  if (filters?.tags?.length) query.tags = { $in: filters.tags };

  return await this.channels.find(query).sort({ createdAt: -1 }).toArray();
}

// Template management
async;
createTemplate(
    template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>
  )
: Promise<NotificationTemplate>
{
  try {
    const newTemplate: NotificationTemplate = {
      ...template,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Validate template syntax
    this.validateTemplate(newTemplate);

    await this.templates.insertOne(newTemplate);

    logger.info(`Notification template created: ${newTemplate.id}`);
    return newTemplate;
  } catch (error) {
    logger.error('Failed to create notification template', error);
    throw error;
  }
}

async;
getTemplate(id: string)
: Promise<NotificationTemplate | null>
{
  return await this.templates.findOne({ id });
}

async;
listTemplates(
    organizationId: string,
    channelType?: NotificationChannel['type']
  )
: Promise<NotificationTemplate[]>
{
  const query: any = { organizationId };
  if (channelType) query.channelType = channelType;

  return await this.templates.find(query).sort({ createdAt: -1 }).toArray();
}
