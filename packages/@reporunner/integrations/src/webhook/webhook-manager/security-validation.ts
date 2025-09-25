this.emit('webhook:unregistered', {
  id,
  integrationName: webhook.integrationName,
});

return true;
}

  /**
   * Pause webhook
   */
  pauseWebhook(id: string): boolean
{
  const webhook = this.webhooks.get(id);
  if (!webhook) {
    return false;
  }

  webhook.status = 'paused';
  this.emit('webhook:paused', { id });

  return true;
}

/**
 * Resume webhook
 */
resumeWebhook(id: string)
: boolean
{
  const webhook = this.webhooks.get(id);
  if (!webhook) {
    return false;
  }

  webhook.status = 'active';
  webhook.error = undefined;
  this.emit('webhook:resumed', { id });

  return true;
}

/**
 * Get webhook by ID
 */
getWebhook(id: string)
: WebhookRegistration | undefined
{
  return this.webhooks.get(id);
}

/**
 * Get all webhooks
 */
getAllWebhooks();
: WebhookRegistration[]
{
  return Array.from(this.webhooks.values());
}

/**
 * Get webhooks by integration
 */
getWebhooksByIntegration(integrationName: string)
: WebhookRegistration[]
{
  return Array.from(this.webhooks.values()).filter(
      (webhook) => webhook.integrationName === integrationName
    );
}

/**
 * Get webhook statistics
 */
getStatistics();
:
{
  totalWebhooks: number;
  activeWebhooks: number;
  pausedWebhooks: number;
  errorWebhooks: number;
  queueSize: number;
  totalEvents: number;
}
{
  const webhooksArray = Array.from(this.webhooks.values());

  return {
      totalWebhooks: webhooksArray.length,
      activeWebhooks: webhooksArray.filter((w) => w.status === 'active').length,
      pausedWebhooks: webhooksArray.filter((w) => w.status === 'paused').length,
      errorWebhooks: webhooksArray.filter((w) => w.status === 'error').length,
      queueSize: this.eventQueue.length,
      totalEvents: webhooksArray.reduce((sum, w) => sum + w.triggerCount, 0),
    };
}

/**
 * Get success count for webhook
 */
private
getSuccessCount(_webhookId: string)
: number
{
  // This would be tracked in a real implementation
  return 0;
}

/**
 * Generate webhook ID
 */
private
generateWebhookId();
: string
{
  return `webhook_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}
