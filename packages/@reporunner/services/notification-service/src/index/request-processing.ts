// Notification sending
async;
sendNotification(request: NotificationRequest)
: Promise<string>
{
    try {
      // Generate request ID if not provided
      if (!request.id) {
        request.id = uuidv4();
      }

      // Check for deduplication
      if (request.deduplicationId) {
        const existing = await this.requests.findOne({
          deduplicationId: request.deduplicationId,
          organizationId: request.organizationId,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        });

        if (existing) {
          logger.info(`Duplicate notification request ignored: ${request.deduplicationId}`);
          return existing.id!;
        }
      }

      // Validate channel exists
      const channel = await this.getChannel(request.channelId);
      if (!channel) {
        throw new Error(`Channel not found: ${request.channelId}`);
      }

      if (!channel.enabled) {
        throw new Error(`Channel disabled: ${request.channelId}`);
      }

      // Process template if provided
      let content = request.content || '';
      let subject = request.subject;

      if (request.templateId) {
        const template = await this.getTemplate(request.templateId);
        if (!template) {
          throw new Error(`Template not found: ${request.templateId}`);
        }

        content = this.renderTemplate(template.template, request.variables || {});
        if (template.subject) {
          subject = this.renderTemplate(template.subject, request.variables || {});
        }
      }

      // Save request
      const notificationRequest: NotificationRequest = {
        ...request,
        createdAt: new Date()
      } as NotificationRequest;

      await this.requests.insertOne(notificationRequest);

      // Create jobs for each recipient
      for (const recipient of request.recipients) {
        const jobData: NotificationJobData = {
          requestId: request.id!,
          recipientId: recipient.id,
          channelId: request.channelId,
          subject,
          content,
          metadata: {
            recipient,
            ...request.metadata
          },
          attempt: 1
        };

        // Schedule or send immediately
        const delay = request.scheduledAt
          ? Math.max(0, request.scheduledAt.getTime() - Date.now())
          : 0;

        await this.notificationQueue.add(
          'send-notification',
          jobData,
          {
            delay,
            priority: this.getPriorityWeight(request.priority),
            jobId: `${request.id}:${recipient.id}`
          }
        );

        // Create result record
        const result: NotificationResult = {
          id: uuidv4(),
          requestId: request.id!,
          recipientId: recipient.id,
          channelId: request.channelId,
          status: delay > 0 ? 'pending' : 'pending',
          createdAt: new Date(),
          attempts: 0,
          maxAttempts: this.config.queue.retryAttempts
        };

        await this.results.insertOne(result);
