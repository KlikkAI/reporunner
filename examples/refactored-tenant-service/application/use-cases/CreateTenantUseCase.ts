import { BaseUseCase } from '../../../../shared/base/BaseUseCase';
import type { IEventBus } from '../../../shared/types/IEventBus';
import type { ILogger } from '../../../shared/types/ILogger';
import { Tenant } from '../../domain/entities/Tenant.entity';
import { TenantPlan } from '../../domain/value-objects/TenantPlan.vo';
import {
  InvalidTenantDataError,
  SubdomainAlreadyExistsError,
  TenantCreationError,
} from '../../shared/exceptions/tenant.exceptions';
import type { CreateTenantRequest } from '../dto/CreateTenantRequest.dto';
import { TenantResponse } from '../dto/TenantResponse.dto';
import type { ITenantRepository } from '../interfaces/ITenantRepository';
import { CreateTenantRequestValidator } from '../validators/CreateTenantRequestValidator';

/**
 * CreateTenantUseCase
 *
 * Application service responsible for:
 * - Tenant creation business logic
 * - Input validation and sanitization
 * - Uniqueness constraints enforcement
 * - Domain event publishing
 * - Error handling and logging
 *
 * Line count: ~95 lines (Single responsibility, focused use case)
 */
export class CreateTenantUseCase extends BaseUseCase<CreateTenantRequest, TenantResponse> {
  private readonly validator: CreateTenantRequestValidator;

  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly eventBus: IEventBus,
    logger: ILogger
  ) {
    super(logger);
    this.validator = new CreateTenantRequestValidator();
  }

  public async execute(request: CreateTenantRequest): Promise<TenantResponse> {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();

    this.logger.info('Creating new tenant', {
      correlationId,
      request: this.sanitizeRequest(request),
    });

    try {
      // Step 1: Validate request
      await this.validateRequest(request);

      // Step 2: Check business constraints
      await this.ensureSubdomainUniqueness(request.subdomain, correlationId);

      // Step 3: Create tenant entity
      const tenant = Tenant.create({
        name: request.name,
        subdomain: request.subdomain,
        adminEmail: request.adminEmail,
        plan: TenantPlan.fromString(request.planType),
        settings: request.settings,
      });

      // Step 4: Persist tenant
      const savedTenant = await this.tenantRepository.save(tenant);

      // Step 5: Publish domain events
      await this.publishDomainEvents(tenant, correlationId);

      const duration = Date.now() - startTime;
      this.logger.info('Tenant created successfully', {
        correlationId,
        tenantId: savedTenant.id,
        subdomain: savedTenant.subdomain,
        duration,
      });

      // Step 6: Return response
      return TenantResponse.fromEntity(savedTenant);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Failed to create tenant', {
        correlationId,
        error: error.message,
        stack: error.stack,
        request: this.sanitizeRequest(request),
        duration,
      });

      // Re-throw known business errors, wrap unknown errors
      if (error instanceof SubdomainAlreadyExistsError || error instanceof InvalidTenantDataError) {
        throw error;
      }

      throw new TenantCreationError('Failed to create tenant', error);
    }
  }

  protected async validateRequest(request: CreateTenantRequest): Promise<void> {
    this.logger.debug('Validating create tenant request');

    try {
      await this.validator.validate(request);
    } catch (validationError) {
      this.logger.warn('Request validation failed', {
        errors: validationError.errors,
        request: this.sanitizeRequest(request),
      });
      throw new InvalidTenantDataError('Invalid tenant data provided', validationError.errors);
    }
  }

  private async ensureSubdomainUniqueness(subdomain: string, correlationId: string): Promise<void> {
    this.logger.debug('Checking subdomain uniqueness', { correlationId, subdomain });

    const existingTenant = await this.tenantRepository.findBySubdomain(subdomain);

    if (existingTenant) {
      this.logger.warn('Subdomain already exists', {
        correlationId,
        subdomain,
        existingTenantId: existingTenant.id,
      });

      throw new SubdomainAlreadyExistsError(`Subdomain '${subdomain}' is already in use`);
    }

    this.logger.debug('Subdomain is unique', { correlationId, subdomain });
  }

  private async publishDomainEvents(tenant: Tenant, correlationId: string): Promise<void> {
    const events = tenant.getUncommittedEvents();

    this.logger.debug('Publishing domain events', {
      correlationId,
      tenantId: tenant.id,
      eventCount: events.length,
    });

    for (const event of events) {
      try {
        await this.eventBus.publish(event);
        this.logger.debug('Domain event published', {
          correlationId,
          eventType: event.type,
          tenantId: tenant.id,
        });
      } catch (eventError) {
        this.logger.error('Failed to publish domain event', {
          correlationId,
          eventType: event.type,
          tenantId: tenant.id,
          error: eventError.message,
        });
        // Continue with other events - event publishing failures shouldn't fail the use case
      }
    }

    tenant.markEventsAsCommitted();
  }

  private sanitizeRequest(request: CreateTenantRequest): Partial<CreateTenantRequest> {
    return {
      name: request.name,
      subdomain: request.subdomain,
      planType: request.planType,
      // Exclude potentially sensitive data from logs
      adminEmail: request.adminEmail
        ? `${request.adminEmail.substring(0, 3)}***@${request.adminEmail.split('@')[1]}`
        : undefined,
    };
  }

  private generateCorrelationId(): string {
    return `create-tenant-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
