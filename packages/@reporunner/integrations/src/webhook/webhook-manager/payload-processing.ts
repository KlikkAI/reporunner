* Start event processor
   */
  private startEventProcessor(): void
{
  setInterval(async () => {
    if (!this.processing && this.eventQueue.length > 0) {
      await this.processEvents();
    }
  }, 1000); // Process every second
}

/**
 * Process queued events
 */
private
async;
processEvents();
: Promise<void>
{
  this.processing = true;

  while (this.eventQueue.length > 0) {
    const event = this.eventQueue.shift();
    if (!event) continue;

    const webhook = this.webhooks.get(event.webhookId);
    if (!webhook || webhook.status !== 'active') {
      continue;
    }

    try {
      // Execute handler with retry logic
      await this.executeWithRetry(() => webhook.handler(event), webhook.config.maxRetries || 3);

      event.processed = true;

      this.emit('webhook:processed', { webhookId: event.webhookId, event });
    } catch (error: any) {
      event.error = error.message;

      this.emit('webhook:processing_failed', {
        webhookId: event.webhookId,
        event,
        error,
      });

      // Mark webhook as error if too many failures
      if (webhook.triggerCount > 10 && webhook.status === 'active') {
        const failureRate =
          (webhook.triggerCount - this.getSuccessCount(webhook.id)) / webhook.triggerCount;
        if (failureRate > 0.5) {
          webhook.status = 'error';
          webhook.error = 'Too many processing failures';
        }
      }
    }
  }

  this.processing = false;
}

/**
 * Execute with retry
 */
private
async;
executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  )
: Promise<T>
{
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        await this.sleep(delay * 2 ** attempt);
      }
    }
  }

  throw lastError;
}

/**
 * Unregister webhook
 */
unregisterWebhook(id: string)
: boolean
{
    const webhook = this.webhooks.get(id);
    if (!webhook) {
      return false;
    }

    this.webhooks.delete(id);

    // Remove route
    const routes = this.router.stack;
    const index = routes.findIndex((layer: any) => layer.route?.path === webhook.config.path);

    if (index !== -1) {
      routes.splice(index, 1);
    }
