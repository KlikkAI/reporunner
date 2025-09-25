import { Express } from 'express';
import express from 'express';
import { Container } from '../../../shared/di/Container';
import { EventBus } from '../../../shared/events/EventBus';
import {
  createMongoConnection,
  createRedisClient,
  createLogger,
} from '../../../shared/infrastructure';
import { TenantRepository } from '../infrastructure/repositories/TenantRepository';
import { CreateTenantUseCase } from '../application/use-cases/CreateTenantUseCase';
import { GetTenantUseCase } from '../application/use-cases/GetTenantUseCase';
import { UpdateTenantUseCase } from '../application/use-cases/UpdateTenantUseCase';
import { DeleteTenantUseCase } from '../application/use-cases/DeleteTenantUseCase';
import { TenantController } from '../presentation/controllers/TenantController';
import { ILogger, IDatabase, ICache, IEventBus } from '../shared/types';

/**
 * TenantServiceBootstrap
 *
 * Responsible for:
 * - Dependency injection container setup
 * - Service registration and wiring
 * - Application initialization
 * - HTTP server configuration
 * - Event handler setup
 *
 * Line count: ~185 lines (Clean, focused initialization)
 */
export class TenantServiceBootstrap {
  private container: Container;
  private logger: ILogger;

  constructor() {
    this.container = new Container();
    this.logger = createLogger('TenantService');
  }

  /**
   * Register all service dependencies in the DI container
   */
  private registerServices(): void {
    this.logger.info('Registering service dependencies...');

    // Infrastructure registration (Singletons)
    this.container.registerSingleton('MongoDatabase', () => {
      return createMongoConnection({
        url: process.env.MONGO_URL || 'mongodb://localhost:27017/reporunner',
        options: {
          maxPoolSize: 10,
          minPoolSize: 2,
          retryWrites: true,
          w: 'majority',
        },
      });
    });

    this.container.registerSingleton('RedisCache', () => {
      return createRedisClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
      });
    });

    this.container.registerSingleton('Logger', () => {
      return createLogger('TenantService', {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.NODE_ENV === 'production' ? 'json' : 'colored',
      });
    });

    this.container.registerSingleton('EventBus', () => {
      const logger = this.container.resolve<ILogger>('Logger');
      return new EventBus(logger);
    });

    // Repository registration
    this.container.register('TenantRepository', () => {
      const db = this.container.resolve<IDatabase>('MongoDatabase');
      const cache = this.container.resolve<ICache>('RedisCache');
      const logger = this.container.resolve<ILogger>('Logger');
      return new TenantRepository(db, cache, logger);
    });

    // Use case registration
    this.container.register('CreateTenantUseCase', () => {
      const repo = this.container.resolve<TenantRepository>('TenantRepository');
      const eventBus = this.container.resolve<IEventBus>('EventBus');
      const logger = this.container.resolve<ILogger>('Logger');
      return new CreateTenantUseCase(repo, eventBus, logger);
    });

    this.container.register('GetTenantUseCase', () => {
      const repo = this.container.resolve<TenantRepository>('TenantRepository');
      const logger = this.container.resolve<ILogger>('Logger');
      return new GetTenantUseCase(repo, logger);
    });

    this.container.register('UpdateTenantUseCase', () => {
      const repo = this.container.resolve<TenantRepository>('TenantRepository');
      const eventBus = this.container.resolve<IEventBus>('EventBus');
      const logger = this.container.resolve<ILogger>('Logger');
      return new UpdateTenantUseCase(repo, eventBus, logger);
    });

    this.container.register('DeleteTenantUseCase', () => {
      const repo = this.container.resolve<TenantRepository>('TenantRepository');
      const eventBus = this.container.resolve<IEventBus>('EventBus');
      const logger = this.container.resolve<ILogger>('Logger');
      return new DeleteTenantUseCase(repo, eventBus, logger);
    });

    // Controller registration
    this.container.register('TenantController', () => {
      const createUseCase = this.container.resolve<CreateTenantUseCase>('CreateTenantUseCase');
      const getUseCase = this.container.resolve<GetTenantUseCase>('GetTenantUseCase');
      const updateUseCase = this.container.resolve<UpdateTenantUseCase>('UpdateTenantUseCase');
      const deleteUseCase = this.container.resolve<DeleteTenantUseCase>('DeleteTenantUseCase');
      return new TenantController(createUseCase, getUseCase, updateUseCase, deleteUseCase);
    });
  }

  /**
   * Start the tenant service
   */
  public async start(): Promise<void> {
    try {
      this.logger.info('Starting Tenant Service...');

      // Register services
      this.registerServices();

      // Initialize infrastructure connections
      await this.initializeInfrastructure();

      // Setup event handlers
      await this.setupEventHandlers();

      // Start HTTP server
      const app = await this.createExpressApp();
      const port = parseInt(process.env.PORT || '3001');

      app.listen(port, () => {
        this.logger.info(`🚀 Tenant Service listening on port ${port}`);
        this.logger.info(`📊 Health check available at http://localhost:${port}/health`);
        this.logger.info(`📚 API docs available at http://localhost:${port}/api-docs`);
      });
    } catch (error) {
      this.logger.error('Failed to start Tenant Service', { error });
      process.exit(1);
    }
  }

  /**
   * Initialize infrastructure connections
   */
  private async initializeInfrastructure(): Promise<void> {
    this.logger.info('Initializing infrastructure connections...');

    // Database initialization
    const database = this.container.resolve<IDatabase>('MongoDatabase');
    await database.connect();
    this.logger.info('✅ MongoDB connection established');

    // Cache initialization
    const cache = this.container.resolve<ICache>('RedisCache');
    await cache.connect();
    this.logger.info('✅ Redis cache connection established');

    // Ensure database indexes
    await this.createDatabaseIndexes(database);
  }

  /**
   * Setup domain event handlers
   */
  private async setupEventHandlers(): Promise<void> {
    const eventBus = this.container.resolve<IEventBus>('EventBus');

    // Tenant lifecycle events
    eventBus.subscribe('tenant.created', async (event) => {
      this.logger.info('Processing tenant.created event', { tenantId: event.tenantId });
      // Handle post-creation tasks (welcome emails, setup defaults, etc.)
    });

    eventBus.subscribe('tenant.plan.changed', async (event) => {
      this.logger.info('Processing tenant.plan.changed event', {
        tenantId: event.tenantId,
        oldPlan: event.oldPlan,
        newPlan: event.newPlan,
      });
      // Handle plan change tasks (billing updates, feature adjustments, etc.)
    });

    eventBus.subscribe('tenant.suspended', async (event) => {
      this.logger.warn('Processing tenant.suspended event', {
        tenantId: event.tenantId,
        reason: event.reason,
      });
      // Handle suspension tasks (disable access, send notifications, etc.)
    });

    this.logger.info('✅ Event handlers registered');
  }

  /**
   * Create and configure Express application
   */
  private async createExpressApp(): Promise<Express> {
    const app = express();

    // Middleware
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        service: 'tenant-service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.SERVICE_VERSION || '1.0.0',
      });
    });

    // API routes
    const controller = this.container.resolve<TenantController>('TenantController');
    app.use('/api/tenants', controller.getRoutes());

    // Error handling
    app.use((error: any, req: any, res: any, next: any) => {
      this.logger.error('Unhandled API error', { error, url: req.url, method: req.method });
      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
      });
    });

    return app;
  }

  /**
   * Create necessary database indexes for performance
   */
  private async createDatabaseIndexes(database: IDatabase): Promise<void> {
    const tenantsCollection = database.collection('tenants');

    // Create indexes for common queries
    await Promise.all([
      tenantsCollection.createIndex({ subdomain: 1 }, { unique: true, name: 'subdomain_unique' }),
      tenantsCollection.createIndex({ status: 1 }, { name: 'status_index' }),
      tenantsCollection.createIndex({ plan: 1 }, { name: 'plan_index' }),
      tenantsCollection.createIndex({ createdAt: 1 }, { name: 'created_date_index' }),
      tenantsCollection.createIndex(
        { 'billing.nextBillingDate': 1 },
        { name: 'billing_date_index' }
      ),
    ]);

    this.logger.info('✅ Database indexes created');
  }

  /**
   * Graceful shutdown handling
   */
  public async stop(): Promise<void> {
    this.logger.info('Shutting down Tenant Service...');

    try {
      // Close database connections
      const database = this.container.resolve<IDatabase>('MongoDatabase');
      await database.disconnect();

      // Close cache connections
      const cache = this.container.resolve<ICache>('RedisCache');
      await cache.disconnect();

      this.logger.info('✅ Tenant Service shut down gracefully');
    } catch (error) {
      this.logger.error('Error during shutdown', { error });
    }
  }
}

// Process signal handlers for graceful shutdown
const bootstrap = new TenantServiceBootstrap();

process.on('SIGTERM', async () => {
  await bootstrap.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await bootstrap.stop();
  process.exit(0);
});

// Start the service if this file is run directly
if (require.main === module) {
  bootstrap.start().catch((error) => {
    console.error('Failed to start service:', error);
    process.exit(1);
  });
}

export default bootstrap;
