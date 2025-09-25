} =
{
}
): string
{
  const subscriptionId = this.generateSubscriptionId();

  const subscription: EventSubscription = {
    id: subscriptionId,
    pattern,
    handler,
    filter: options.filter,
    once: options.once || false,
    priority: options.priority || 0,
    createdAt: new Date(),
  };

  this.subscriptions.set(subscriptionId, subscription);

  this.emit('subscription:created', {
    id: subscriptionId,
    pattern: pattern.toString(),
  });

  return subscriptionId;
}

/**
 * Unsubscribe from events
 */
unsubscribe(subscriptionId: string)
: boolean
{
  const existed = this.subscriptions.delete(subscriptionId);

  if (existed) {
    this.emit('subscription:removed', { id: subscriptionId });
  }

  return existed;
}

/**
 * Process event queue
 */
private
async;
processQueue();
: Promise<void>
{
  this.isProcessing = true;

  while (this.processingQueue.length > 0) {
    const payload = this.processingQueue.shift();
    if (!payload) continue;

    await this.processEvent(payload);
  }

  this.isProcessing = false;
}

/**
 * Process single event
 */
private
async;
processEvent(payload: EventPayload)
: Promise<void>
{
  const eventKey = `${payload.source}:${payload.event}`;

  // Get matching subscriptions
  const matchingSubscriptions = this.getMatchingSubscriptions(eventKey, payload);

  // Sort by priority (higher priority first)
  matchingSubscriptions.sort((a, b) => (b.priority || 0) - (a.priority || 0));

  // Execute handlers
  for (const subscription of matchingSubscriptions) {
    try {
      await this.executeHandler(subscription, payload);

      // Remove if it was a one-time subscription
      if (subscription.once) {
        this.subscriptions.delete(subscription.id);
      }
    } catch (error: any) {
      this.handleError(subscription, payload, error);
    }
  }
}

/**
 * Get matching subscriptions for an event
 */
private
getMatchingSubscriptions(eventKey: string, payload: EventPayload)
: EventSubscription[]
{
    const matching: EventSubscription[] = [];

    this.subscriptions.forEach((subscription) => {
      // Check pattern match
      let matches = false;

      if (typeof subscription.pattern === 'string') {
        // Exact match or wildcard pattern
        if (subscription.pattern === '*' || subscription.pattern === '**') {
          matches = true;
        } else if (subscription.pattern.includes('*')) {
          matches = this.matchWildcard(eventKey, subscription.pattern);
        } else {
          matches = eventKey === subscription.pattern;
        }
      } else if (subscription.pattern instanceof RegExp) {
