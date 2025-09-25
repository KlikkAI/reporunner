* Publish event
   */
  async publishEvent(source: string, event: string, data: any, metadata?: any): Promise<void>
{
  await this.eventBus.publish(source, event, data, metadata);
}

/**
 * Subscribe to events
 */
subscribeToEvents(pattern: string | RegExp, handler: any, options?: any)
: string
{
  return this.eventBus.subscribe(pattern, handler, options);
}

/**
 * Get framework statistics
 */
getStatistics();
:
{
  registry: any;
  eventBus: any;
  webhooks: any;
  health: any;
  rateLimit: any;
}
{
  return {
      registry: this.registry.getStatistics(),
      eventBus: this.eventBus.getStatistics(),
      webhooks: this.webhookManager.getStatistics(),
      health: this.healthMonitor.getSummary(),
      rateLimit: this.rateLimiter.getStatistics(),
    };
}

/**
 * Cleanup and shutdown
 */
async;
shutdown();
: Promise<void>
{
  // Destroy all integration instances
  const instances = this.registry.getAllInstances();
  for (const instance of instances) {
    await this.registry.destroyInstance(instance.id);
  }

  // Clear all components
  this.registry.clearAll();
  this.eventBus.clearAll();
  this.webhookManager.clearAll();
  this.healthMonitor.clearAll();
  this.rateLimiter.clearAll();
}
}

// Export singleton instance
export const integrationFramework = IntegrationFramework.getInstance();

// Default export
export default IntegrationFramework;
