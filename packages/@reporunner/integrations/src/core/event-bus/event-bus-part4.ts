if (filter.event) {
  history = history.filter((e) => e.event === filter.event);
}
if (filter.since) {
  history = history.filter((e) => e.timestamp >= filter.since!);
}
if (filter.limit) {
  history = history.slice(-filter.limit);
}
}

return history;
}

  /**
   * Wait for event
   */
  async waitForEvent(
    pattern: string | RegExp,
    timeout: number = 30000,
    filter?: EventFilter
  ): Promise<EventPayload>
{
  return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.unsubscribe(subscriptionId);
        reject(new Error('Event wait timeout'));
      }, timeout);

      const subscriptionId = this.subscribe(
        pattern,
        (payload) => {
          clearTimeout(timer);
          this.unsubscribe(subscriptionId);
          resolve(payload);
        },
        { filter, once: true }
      );
    });
}

/**
 * Create event channel
 */
createChannel(namespace: string)
: EventChannel
{
  return new EventChannel(this, namespace);
}

/**
 * Log event
 */
private
logEvent(_action: string, _payload: EventPayload, _extra?: Record<string, any>)
: void
{
}

/**
 * Generate correlation ID
 */
private
generateCorrelationId();
: string
{
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate subscription ID
 */
private
generateSubscriptionId();
: string
{
  return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get statistics
 */
getStatistics();
:
{
  totalSubscriptions: number;
  queueSize: number;
  historySize: number;
  subscriptionsByPattern: Record<string, number>;
}
{
  const stats: any = {
    totalSubscriptions: this.subscriptions.size,
    queueSize: this.processingQueue.length,
    historySize: this.eventHistory.length,
    subscriptionsByPattern: {},
  };

  this.subscriptions.forEach((sub) => {
    const pattern = sub.pattern.toString();
    stats.subscriptionsByPattern[pattern] = (stats.subscriptionsByPattern[pattern] || 0) + 1;
  });

  return stats;
}

/**
 * Clear all
 */
clearAll();
: void
{
  this.subscriptions.clear();
  this.eventHistory = [];
  this.processingQueue = [];
  this.removeAllListeners();
}
}
