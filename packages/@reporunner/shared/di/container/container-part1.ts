import 'reflect-metadata';
import { Container as InversifyContainer, injectable, inject } from 'inversify';
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
