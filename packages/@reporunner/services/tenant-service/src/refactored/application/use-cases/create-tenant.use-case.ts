import { Tenant } from '../../domain/entities/tenant.entity';
import { TenantPlan } from '../../domain/value-objects/tenant-plan.vo';
import { TenantSettings } from '../../domain/value-objects/tenant-settings.vo';
import { TenantRepository } from '../../domain/repositories/tenant.repository';
import { EventBus } from '../../domain/services/event-bus';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { TenantResponseDto } from '../dto/tenant-response.dto';
import { TenantMapper } from '../mappers/tenant.mapper';
import { TenantValidator } from '../validators/tenant.validator';
import { SlugGenerator } from '../../shared/utils/slug-generator';
import { UseCase } from '../../shared/base/use-case';
import { logger } from '../../shared/utils/logger';

export class CreateTenantUseCase implements UseCase<CreateTenantDto, TenantResponseDto> {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly eventBus: EventBus,
    private readonly validator: TenantValidator
  ) {}

  async execute(dto: CreateTenantDto): Promise<TenantResponseDto> {
    try {
      // Validate input
      await this.validator.validateCreate(dto);

      // Generate unique slug
      const slug = await this.generateUniqueSlug(dto.name);

      // Check if organization exists
      const existingTenant = await this.tenantRepository.findByOrganizationId(dto.organizationId);
      if (existingTenant) {
        throw new Error(`Tenant already exists for organization ${dto.organizationId}`);
      }

      // Create plan value object
      const plan = TenantPlan.fromType(dto.plan || 'starter');

      // Create settings value object
      const settings = new TenantSettings({
        timezone: dto.settings?.timezone || 'UTC',
        dateFormat: dto.settings?.dateFormat || 'YYYY-MM-DD',
        language: dto.settings?.language || 'en',
        features: dto.settings?.features || {},
        branding: dto.settings?.branding,
      });

      // Create tenant entity
      const tenant = Tenant.create({
        name: dto.name,
        slug,
        organizationId: dto.organizationId,
        plan,
        settings,
        ownerId: dto.ownerId,
      });

      // Save to repository
      await this.tenantRepository.save(tenant);

      // Publish domain events
      const events = tenant.getEvents();
      for (const event of events) {
        await this.eventBus.publish(event.eventType, event.payload);
      }

      // Clear events after publishing
      tenant.clearEvents();

      logger.info('Tenant created successfully', {
        tenantId: tenant.id,
        name: tenant.name,
        organizationId: tenant.organizationId,
      });

      // Map to response DTO
      return TenantMapper.toResponseDto(tenant);
    } catch (error) {
      logger.error('Failed to create tenant', error);
      throw error;
    }
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    let slug = SlugGenerator.generate(name);
    let suffix = 0;

    while (await this.tenantRepository.findBySlug(slug)) {
      suffix++;
      slug = `${SlugGenerator.generate(name)}-${suffix}`;
    }

    return slug;
  }
}
