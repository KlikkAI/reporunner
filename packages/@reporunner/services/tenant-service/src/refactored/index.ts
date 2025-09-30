import type { Server } from 'node:http';
import compression from 'compression';
import cors from 'cors';
import express, { type Application } from 'express';
import helmet from 'helmet';
import { ServiceConfig } from './config/service.config';
import { RedisCache } from './infrastructure/cache/redis-cache';
import { DatabaseConnection } from './infrastructure/database/connection';
import { ServiceRegistry } from './infrastructure/discovery/service-registry';
import { EventBusAdapter } from './infrastructure/events/event-bus.adapter';
import { MetricsCollector } from './infrastructure/monitoring/metrics.collector';
import { QueueManager } from './infrastructure/queue/queue.manager';
import { ErrorMiddleware } from './presentation/middleware/error.middleware';
import { LoggingMiddleware } from './presentation/middleware/logging.middleware';
import { HealthRouter } from './presentation/routes/health.routes';
import { InvitationRouter } from './presentation/routes/invitation.routes';
import { MemberRouter } from './presentation/routes/member.routes';
import { TenantRouter } from './presentation/routes/tenant.routes';
import { logger } from './shared/utils/logger';

export class TenantServiceBootstrap {
  private app: Application;
  private server: Server | null = null;
  private config: ServiceConfig;
  private database: DatabaseConnection;
  private cache: RedisCache;
  private eventBus: EventBusAdapter;
  private queueManager: QueueManager;
  private metricsCollector: MetricsCollector;
  private serviceRegistry: ServiceRegistry;

  constructor() {
    this.config = ServiceConfig.getInstance();
    this.app = express();
  }

  async initialize(): Promise<void> {
    try {
      // Initialize infrastructure
      await this.setupInfrastructure();

      // Setup middleware
      this.setupMiddleware();

      // Setup routes
      this.setupRoutes();

      // Setup error handling
      this.setupErrorHandling();

      logger.info('Tenant Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Tenant Service', error);
      throw error;
    }
  }

  private async setupInfrastructure(): Promise<void> {
    // Database connection
    this.database = await DatabaseConnection.getInstance();
    await this.database.connect();

    // Cache setup
    this.cache = await RedisCache.getInstance();
    await this.cache.connect();

    // Event bus
    this.eventBus = await EventBusAdapter.getInstance();
    await this.eventBus.connect();

    // Queue manager
    this.queueManager = new QueueManager(this.config.queue);
    await this.queueManager.initialize();

    // Metrics collector
    this.metricsCollector = new MetricsCollector();
    this.metricsCollector.start();

    // Service registry
    this.serviceRegistry = new ServiceRegistry(this.config.discovery);
    await this.serviceRegistry.register({
      name: 'tenant-service',
      version: '1.0.0',
      port: this.config.port,
      health: '/health',
    });
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors(this.config.cors));
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(LoggingMiddleware.log());
    this.app.use(this.metricsCollector.middleware());
  }

  private setupRoutes(): void {
    const apiPrefix = '/api/v1';

    // Health check routes
    this.app.use(apiPrefix, new HealthRouter().getRouter());

    // Business routes
    this.app.use(
      `${apiPrefix}/tenants`,
      new TenantRouter(this.database, this.cache, this.eventBus).getRouter()
    );

    this.app.use(
      `${apiPrefix}/members`,
      new MemberRouter(this.database, this.cache, this.eventBus).getRouter()
    );

    this.app.use(
      `${apiPrefix}/invitations`,
      new InvitationRouter(this.database, this.cache, this.eventBus).getRouter()
    );
  }

  private setupErrorHandling(): void {
    this.app.use(ErrorMiddleware.handle());
  }

  async start(): Promise<void> {
    await this.initialize();

    this.server = this.app.listen(this.config.port, () => {
      logger.info(`Tenant Service listening on port ${this.config.port}`);
    });

    this.setupGracefulShutdown();
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully`);

      if (this.server) {
        this.server.close(async () => {
          await this.cleanup();
          process.exit(0);
        });
      }

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  private async cleanup(): Promise<void> {
    try {
      await this.serviceRegistry?.deregister();
      await this.queueManager?.shutdown();
      await this.eventBus?.disconnect();
      await this.cache?.disconnect();
      await this.database?.disconnect();
      this.metricsCollector?.stop();

      logger.info('Cleanup completed');
    } catch (error) {
      logger.error('Error during cleanup', error);
    }
  }
}

// Bootstrap the service
if (require.main === module) {
  const service = new TenantServiceBootstrap();
  service.start().catch((error) => {
    logger.error('Failed to start Tenant Service', error);
    process.exit(1);
  });
}

export default TenantServiceBootstrap;
