identifier: TYPES.Cache, implementation;
: RedisCache,
      lifecycle: 'singleton'
    })

this.register(
{
  identifier: TYPES.EventBus, implementation;
  : EventBusAdapter,
  lifecycle: 'singleton',
}
)

this.register(
{
  identifier: TYPES.Queue, implementation;
  : QueueManager,
  lifecycle: 'singleton',
}
)

this.register(
{
  identifier: TYPES.Logger, implementation;
  : logger,
  factory: () => logger,
}
)
}

  // Register environment-specific services
  private async registerEnvironmentServices(): Promise<void>
{
  switch (this.config.environment) {
    case 'test':
      await this.registerTestServices();
      break;
    case 'development':
      await this.registerDevelopmentServices();
      break;
    case 'production':
      await this.registerProductionServices();
      break;
    default:
      await this.registerDefaultServices();
  }
}

private
async;
registerTestServices();
: Promise<void>
{
  // Mock services for testing
  logger.info('Registering test services');
}

private
async;
registerDevelopmentServices();
: Promise<void>
{
  // Development-specific services
  logger.info('Registering development services');
}

private
async;
registerProductionServices();
: Promise<void>
{
  // Production-optimized services
  logger.info('Registering production services');
}

private
async;
registerDefaultServices();
: Promise<void>
{
  // Default service registrations
  logger.info('Registering default services');
}

// Cleanup and reset
async;
dispose();
: Promise<void>
{
  // Dispose all singleton services
  const singletons = this.container.getAll(Symbol.for('*'));

  for (const service of singletons) {
    if (typeof (service as any).dispose === 'function') {
      await (service as any).dispose();
    }
  }

  this.container.unbindAll();
  this.initialized = false;
  logger.info('DI Container disposed');
}

// Module registration helper
async;
registerModule(moduleLoader: () => Promise<ServiceRegistration[]>)
: Promise<void>
{
  const registrations = await moduleLoader();
  this.registerMany(registrations);
}
}

// Export singleton instance
export const container = DIContainer.getInstance();

// Decorator for automatic registration
export function Service(identifier: symbol, lifecycle?: 'singleton' | 'transient' | 'request') {
  return (target: any) => {
    injectable()(target);
    
    // Auto-register when decorator is applied
    setTimeout(() => {
      container.register({
        identifier,
        implementation: target,
        lifecycle: lifecycle || 'singleton'
      });
    }, 0);
