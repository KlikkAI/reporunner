import 'reflect-metadata';
import { Container as InversifyContainer, inject, injectable } from 'inversify';
import { logger } from '../utils/logger';

// Service identifiers
export const TYPES = {
  // Infrastructure
  Database: Symbol.for('Database'),
  Cache: Symbol.for('Cache'),
  EventBus: Symbol.for('EventBus'),
  Queue: Symbol.for('Queue'),
  Logger: Symbol.for('Logger'),

  // Repositories
  TenantRepository: Symbol.for('TenantRepository'),
  WorkflowRepository: Symbol.for('WorkflowRepository'),
  ExecutionRepository: Symbol.for('ExecutionRepository'),
  UserRepository: Symbol.for('UserRepository'),
  AuditRepository: Symbol.for('AuditRepository'),

  // Services
  TenantService: Symbol.for('TenantService'),
  WorkflowService: Symbol.for('WorkflowService'),
  ExecutionService: Symbol.for('ExecutionService'),
  NotificationService: Symbol.for('NotificationService'),
  AnalyticsService: Symbol.for('AnalyticsService'),
  AuditService: Symbol.for('AuditService'),

  // Use Cases
  CreateTenantUseCase: Symbol.for('CreateTenantUseCase'),
  UpdateTenantUseCase: Symbol.for('UpdateTenantUseCase'),
  DeleteTenantUseCase: Symbol.for('DeleteTenantUseCase'),
  CreateWorkflowUseCase: Symbol.for('CreateWorkflowUseCase'),
  ExecuteWorkflowUseCase: Symbol.for('ExecuteWorkflowUseCase'),

  // Controllers
  TenantController: Symbol.for('TenantController'),
  WorkflowController: Symbol.for('WorkflowController'),
  ExecutionController: Symbol.for('ExecutionController'),

  // Middleware
  AuthMiddleware: Symbol.for('AuthMiddleware'),
  ValidationMiddleware: Symbol.for('ValidationMiddleware'),
  RateLimitMiddleware: Symbol.for('RateLimitMiddleware'),

  // Validators
  TenantValidator: Symbol.for('TenantValidator'),
  WorkflowValidator: Symbol.for('WorkflowValidator'),

  // Mappers
  TenantMapper: Symbol.for('TenantMapper'),
  WorkflowMapper: Symbol.for('WorkflowMapper'),
};

// Decorator exports for convenience
export { injectable, inject };

// Container configuration interface
export interface ContainerConfig {
  environment: 'development' | 'staging' | 'production' | 'test';
  serviceName: string;
  version: string;
}

// Service registration interface
export interface ServiceRegistration {
  identifier: symbol;
  implementation: any;
  lifecycle?: 'singleton' | 'transient' | 'request';
  factory?: () => any;
}

// IoC Container wrapper
export class DIContainer {
  private static instance: DIContainer;
  private container: InversifyContainer;
  private config: ContainerConfig;
  private initialized = false;

  private constructor() {
    this.container = new InversifyContainer({
      defaultScope: 'Singleton',
      skipBaseClassChecks: true,
    });
  }

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  // Initialize container with configuration
  async initialize(config: ContainerConfig): Promise<void> {
    if (this.initialized) {
      logger.warn('Container already initialized');
      return;
    }

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
  register<T>(registration: ServiceRegistration): void {
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
  registerMany(registrations: ServiceRegistration[]): void {
    registrations.forEach((reg) => this.register(reg));
  }

  // Get a service from container
  get<T>(identifier: symbol): T {
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
  getOptional<T>(identifier: symbol): T | null {
    try {
      return this.get<T>(identifier);
    } catch {
      return null;
    }
  }

  // Get all services for an identifier
  getAll<T>(identifier: symbol): T[] {
    try {
      return this.container.getAll<T>(identifier);
    } catch {
      return [];
    }
  }

  // Check if service is registered
  has(identifier: symbol): boolean {
    return this.container.isBound(identifier);
  }

  // Create child container for request scope
  createChildContainer(): InversifyContainer {
    return this.container.createChild();
  }

  // Register core services
  private async registerCoreServices(): Promise<void> {
    // These would be imported from actual implementations
    const { DatabaseConnection } = await import('../infrastructure/database/connection');
    const { RedisCache } = await import('../infrastructure/cache/redis-cache');
    const { EventBusAdapter } = await import('../infrastructure/events/event-bus.adapter');
    const { QueueManager } = await import('../infrastructure/queue/queue.manager');

    // Register infrastructure services
    this.register({
      identifier: TYPES.Database,
      implementation: DatabaseConnection,
      lifecycle: 'singleton',
    });

    this.register({
      identifier: TYPES.Cache,
      implementation: RedisCache,
      lifecycle: 'singleton',
    });

    this.register({
      identifier: TYPES.EventBus,
      implementation: EventBusAdapter,
      lifecycle: 'singleton',
    });

    this.register({
      identifier: TYPES.Queue,
      implementation: QueueManager,
      lifecycle: 'singleton',
    });

    this.register({
      identifier: TYPES.Logger,
      implementation: logger,
      factory: () => logger,
    });
  }

  // Register environment-specific services
  private async registerEnvironmentServices(): Promise<void> {
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

  private async registerTestServices(): Promise<void> {
    // Mock services for testing
    logger.info('Registering test services');
  }

  private async registerDevelopmentServices(): Promise<void> {
    // Development-specific services
    logger.info('Registering development services');
  }

  private async registerProductionServices(): Promise<void> {
    // Production-optimized services
    logger.info('Registering production services');
  }

  private async registerDefaultServices(): Promise<void> {
    // Default service registrations
    logger.info('Registering default services');
  }

  // Cleanup and reset
  async dispose(): Promise<void> {
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
  async registerModule(moduleLoader: () => Promise<ServiceRegistration[]>): Promise<void> {
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
        lifecycle: lifecycle || 'singleton',
      });
    }, 0);

    return target;
  };
}

// Factory decorator
export function Factory(identifier: symbol) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const factory = descriptor.value;

    setTimeout(() => {
      container.register({
        identifier,
        implementation: null,
        factory,
      });
    }, 0);

    return descriptor;
  };
}
