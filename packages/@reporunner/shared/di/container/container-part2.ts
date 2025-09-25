this.config = config;

// Register core services
await this.registerCoreServices();

// Register environment-specific services
await this.registerEnvironmentServices();

this.initialized = true;
logger.info('DI Container initialized', {
  environment: config.environment,
  service: config.serviceName,
  version: config.version,
});
}

  // Register a service
  register<T>(registration: ServiceRegistration): void
{
  const { identifier, implementation, lifecycle, factory } = registration;

  if (factory) {
    this.container.bind(identifier).toFactory(factory);
  } else {
    const binding = this.container.bind(identifier).to(implementation);

    if (lifecycle === 'transient') {
      binding.inTransientScope();
    } else if (lifecycle === 'request') {
      binding.inRequestScope();
    } else {
      binding.inSingletonScope();
    }
  }

  logger.debug(`Registered service: ${identifier.toString()}`);
}

// Register multiple services
registerMany(registrations: ServiceRegistration[])
: void
{
  registrations.forEach((reg) => this.register(reg));
}

// Get a service from container
get<T>(identifier: symbol)
: T
{
  if (!this.initialized) {
    throw new Error('Container not initialized. Call initialize() first.');
  }

  try {
    return this.container.get<T>(identifier);
  } catch (error) {
    logger.error(`Failed to resolve service: ${identifier.toString()}`, error);
    throw error;
  }
}

// Get optional service (returns null if not found)
getOptional<T>(identifier: symbol)
: T | null
{
  try {
    return this.get<T>(identifier);
  } catch {
    return null;
  }
}

// Get all services for an identifier
getAll<T>(identifier: symbol)
: T[]
{
  try {
    return this.container.getAll<T>(identifier);
  } catch {
    return [];
  }
}

// Check if service is registered
has(identifier: symbol)
: boolean
{
  return this.container.isBound(identifier);
}

// Create child container for request scope
createChildContainer();
: InversifyContainer
{
  return this.container.createChild();
}

// Register core services
private
async;
registerCoreServices();
: Promise<void>
{
    // These would be imported from actual implementations
    const { DatabaseConnection } = await import('../infrastructure/database/connection');
    const { RedisCache } = await import('../infrastructure/cache/redis-cache');
    const { EventBusAdapter } = await import('../infrastructure/events/event-bus.adapter');
    const { QueueManager } = await import('../infrastructure/queue/queue.manager');
    
    // Register infrastructure services
    this.register({
      identifier: TYPES.Database,
      implementation: DatabaseConnection,
      lifecycle: 'singleton'
    });
    
    this.register({
