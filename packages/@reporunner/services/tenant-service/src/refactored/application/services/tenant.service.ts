import { BaseService, IBaseService, ServiceResult } from '@reporunner/core/src/service/base-service';
import { TenantValidator } from '../validators/tenant.validator';
import { Tenant } from '../../domain/entities/tenant.entity';
import { TenantRepository } from '../../domain/repositories/tenant.repository';

/**
 * Domain events specific to tenants
 */
export enum TenantEventTypes {
  TENANT_CREATED = 'tenant.created',
  TENANT_UPDATED = 'tenant.updated',
  TENANT_DELETED = 'tenant.deleted',
  TENANT_ACTIVATED = 'tenant.activated',
  TENANT_DEACTIVATED = 'tenant.deactivated'
}

/**
 * Tenant-specific service interface
 */
export interface ITenantService extends IBaseService<Tenant> {
  findByOrganizationId(organizationId: string): Promise<ServiceResult<Tenant>>;
  findBySlug(slug: string): Promise<ServiceResult<Tenant>>;
  activate(id: string): Promise<ServiceResult<Tenant>>;
  deactivate(id: string): Promise<ServiceResult<Tenant>>;
}

/**
 * Service implementation for tenant management
 */
export class TenantService extends BaseService<Tenant> implements ITenantService {
  constructor(
    repository: TenantRepository
  ) {
    super(repository, new TenantValidator());
  }

  /**
   * Find tenant by organization ID
   */
  async findByOrganizationId(organizationId: string): Promise<ServiceResult<Tenant>> {
    return this.execute(async () => {
      const tenant = await (this.repository as TenantRepository).findByOrganizationId(organizationId);
      if (!tenant) {
        throw new Error(`Tenant not found for organization ${organizationId}`);
      }
      return tenant;
    });
  }

  /**
   * Find tenant by slug
   */
  async findBySlug(slug: string): Promise<ServiceResult<Tenant>> {
    return this.execute(async () => {
      const tenant = await (this.repository as TenantRepository).findBySlug(slug);
      if (!tenant) {
        throw new Error(`Tenant not found with slug ${slug}`);
      }
      return tenant;
    });
  }

  /**
   * Activate a tenant
   */
  async activate(id: string): Promise<ServiceResult<Tenant>> {
    return this.execute(async () => {
      const tenant = await this.repository.findById(id);
      if (!tenant) {
        throw new Error(`Tenant not found with ID ${id}`);
      }

      if (tenant.status === 'active') {
        return tenant;
      }

      const updated = await this.repository.update(id, {
        status: 'active',
        deactivatedAt: null
      } as Partial<Tenant>);

      await this.publishEvent({
        eventType: TenantEventTypes.TENANT_ACTIVATED,
        payload: updated,
        metadata: {
          timestamp: new Date(),
          tenantId: id
        }
      });

      return updated;
    });
  }

  /**
   * Deactivate a tenant
   */
  async deactivate(id: string): Promise<ServiceResult<Tenant>> {
    return this.execute(async () => {
      const tenant = await this.repository.findById(id);
      if (!tenant) {
        throw new Error(`Tenant not found with ID ${id}`);
      }

      if (tenant.status === 'inactive') {
        return tenant;
      }

      const updated = await this.repository.update(id, {
        status: 'inactive',
        deactivatedAt: new Date()
      } as Partial<Tenant>);

      await this.publishEvent({
        eventType: TenantEventTypes.TENANT_DEACTIVATED,
        payload: updated,
        metadata: {
          timestamp: new Date(),
          tenantId: id
        }
      });

      return updated;
    });
  }

  // Override base service hooks to add event publishing

  protected async afterCreate(tenant: Tenant): Promise<void> {
    await this.publishEvent({
      eventType: TenantEventTypes.TENANT_CREATED,
      payload: tenant,
      metadata: {
        timestamp: new Date(),
        tenantId: tenant.id
      }
    });
  }

  protected async afterUpdate(tenant: Tenant): Promise<void> {
    await this.publishEvent({
      eventType: TenantEventTypes.TENANT_UPDATED,
      payload: tenant,
      metadata: {
        timestamp: new Date(),
        tenantId: tenant.id
      }
    });
  }

  protected async afterDelete(id: string): Promise<void> {
    await this.publishEvent({
      eventType: TenantEventTypes.TENANT_DELETED,
      payload: { id },
      metadata: {
        timestamp: new Date(),
        tenantId: id
      }
    });
  }
}