import { BaseValidator } from '@reporunner/core/src/validation/validator';
import type { Tenant } from '../../domain/entities/tenant.entity';

/**
 * Validator for tenant entities
 */
export class TenantValidator extends BaseValidator<Tenant> {
  constructor() {
    super();

    // Add validation rules for tenant fields
    this.addValidation('name', [
      this.rules.required('Tenant name is required'),
      this.rules.minLength(3, 'Tenant name must be at least 3 characters long'),
      this.rules.maxLength(100, 'Tenant name cannot exceed 100 characters'),
    ]);

    this.addValidation('slug', [
      this.rules.required('Tenant slug is required'),
      this.rules.minLength(3, 'Tenant slug must be at least 3 characters long'),
      this.rules.maxLength(50, 'Tenant slug cannot exceed 50 characters'),
      this.rules.pattern(
        /^[a-z0-9-]+$/,
        'Tenant slug can only contain lowercase letters, numbers, and hyphens'
      ),
    ]);

    this.addValidation('organizationId', [this.rules.required('Organization ID is required')]);

    this.addValidation('status', [
      this.rules.required('Tenant status is required'),
      this.rules.custom(
        (value) => ['active', 'inactive'].includes(value as string),
        'Invalid tenant status. Must be either "active" or "inactive"',
        'INVALID_STATUS'
      ),
    ]);

    this.addValidation('plan', [
      this.rules.required('Tenant plan is required'),
      this.rules.custom(
        async (value) => {
          if (!value || typeof value !== 'object') {
            return false;
          }
          const plan = value as any;
          return (
            typeof plan.type === 'string' &&
            typeof plan.limits === 'object' &&
            typeof plan.limits.users === 'number' &&
            typeof plan.limits.storage === 'number'
          );
        },
        'Invalid plan configuration',
        'INVALID_PLAN'
      ),
    ]);
  }
}
