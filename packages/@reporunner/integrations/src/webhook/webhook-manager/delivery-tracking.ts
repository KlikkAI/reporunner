/**
 * Generate event ID
 */
private
generateEventId();
: string
{
  return `event_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Sleep utility
 */
private
sleep(ms: number)
: Promise<void>
{
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get Express router
 */
getRouter();
: Router
{
  return this.router;
}

/**
 * Clear all webhooks
 */
clearAll();
: void
{
  this.webhooks.clear();
  this.eventQueue = [];
  this.router.stack = [];
}
}

// Singleton instance
export const webhookManager = new WebhookManager();

export default WebhookManager;
