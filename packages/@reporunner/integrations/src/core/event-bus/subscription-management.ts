matches = subscription.pattern.test(eventKey);
}

// Apply filter if matches and filter exists
if (matches && subscription.filter) {
  matches = subscription.filter(payload);
}

if (matches) {
  matching.push(subscription);
}
})

return matching;
}

  /**
   * Match wildcard pattern
   */
  private matchWildcard(text: string, pattern: string): boolean
{
  // Convert wildcard pattern to regex
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(text);
}

/**
 * Execute handler
 */
private
async;
executeHandler(
    subscription: EventSubscription,
    payload: EventPayload
  )
: Promise<void>
{
  const startTime = Date.now();

  await subscription.handler(payload);

  const duration = Date.now() - startTime;

  this.emit('handler:executed', {
    subscriptionId: subscription.id,
    eventKey: `${payload.source}:${payload.event}`,
    duration,
    correlationId: payload.correlationId,
  });

  if (this.config.enableLogging) {
    this.logEvent('handled', payload, {
      subscriptionId: subscription.id,
      duration,
    });
  }
}

/**
 * Handle handler error
 */
private
handleError(subscription: EventSubscription, payload: EventPayload, error: Error)
: void
{
  this.emit('handler:error', {
    subscriptionId: subscription.id,
    eventKey: `${payload.source}:${payload.event}`,
    error: error.message,
    correlationId: payload.correlationId,
  });

  if (this.config.enableLogging) {
  }
}

/**
 * Add event to history
 */
private
addToHistory(payload: EventPayload)
: void
{
  this.eventHistory.push(payload);

  // Trim history if needed
  if (this.eventHistory.length > this.config.maxEventHistory!) {
    this.eventHistory = this.eventHistory.slice(-this.config.maxEventHistory!);
  }
}

/**
 * Get event history
 */
getHistory(filter?: {
    source?: string;
event?: string;
since?: Date;
limit?: number;
}): EventPayload[]
{
    let history = [...this.eventHistory];

    if (filter) {
      if (filter.source) {
        history = history.filter((e) => e.source === filter.source);
      }
