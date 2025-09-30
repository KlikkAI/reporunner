if (this.config.eventBus?.mock) {
  this.eventBus = new EventEmitter();
}
}

  private async setupDIContainer(): Promise<void>
{
  await container.initialize({
    environment: 'test',
    serviceName: 'test-service',
    version: '1.0.0',
  });

  // Override with test implementations
  if (this.database) {
    container.register({
      identifier: TYPES.Database,
      implementation: null,
      factory: () => this.database,
    });
  }

  if (this.redisClient) {
    container.register({
      identifier: TYPES.Cache,
      implementation: null,
      factory: () => this.redisClient,
    });
  }

  if (this.eventBus) {
    container.register({
      identifier: TYPES.EventBus,
      implementation: null,
      factory: () => this.eventBus,
    });
  }
}

async;
teardown();
: Promise<void>
{
  // Close database connections
  if (this.mongoClient) {
    await this.mongoClient.close();
    this.mongoClient = null;
    this.database = null;
  }

  if (this.mongoServer) {
    await this.mongoServer.stop();
    this.mongoServer = null;
  }

  // Close cache connections
  if (this.redisClient && typeof this.redisClient.quit === 'function') {
    await this.redisClient.quit();
    this.redisClient = null;
  }

  // Clean up event bus
  if (this.eventBus) {
    this.eventBus.removeAllListeners();
    this.eventBus = null;
  }

  // Dispose DI container
  await container.dispose();

  // Re-enable logging
  logger.silent = false;
}

async;
cleanDatabase();
: Promise<void>
{
  if (this.database) {
    const collections = await this.database.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
}

async;
cleanCache();
: Promise<void>
{
  if (this.redisClient && typeof this.redisClient.flushall === 'function') {
    await this.redisClient.flushall();
  }
}

async;
clean();
: Promise<void>
{
  await this.cleanDatabase();
  await this.cleanCache();
}
}

// Test data builders for creating test fixtures
export class TestDataBuilder {
  static createTenant(_overrides?: any) {
    return {
      id: 'test-tenant-id',
      name: 'Test Tenant',
      slug: 'test-tenant',
      organizationId: 'test-org-id',
      plan: {
