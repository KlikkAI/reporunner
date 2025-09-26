import { MockFactory, TestDataBuilder } from '@reporunner/testing/setup/test-setup';
import type { CreateTenantDto } from '../../src/refactored/application/dto/create-tenant.dto';
import { CreateTenantUseCase } from '../../src/refactored/application/use-cases/create-tenant.use-case';
import type { TenantValidator } from '../../src/refactored/application/validators/tenant.validator';
import type { TenantRepository } from '../../src/refactored/domain/repositories/tenant.repository';
import type { EventBus } from '../../src/refactored/domain/services/event-bus';

describe('CreateTenantUseCase', () => {
  let useCase: CreateTenantUseCase;
  let mockRepository: jest.Mocked<TenantRepository>;
  let mockEventBus: jest.Mocked<EventBus>;
  let mockValidator: jest.Mocked<TenantValidator>;

  beforeEach(() => {
    // Create mocks
    mockRepository = MockFactory.createMockRepository();
    mockEventBus = MockFactory.createMockEventBus();
    mockValidator = {
      validateCreate: jest.fn(),
    } as any;

    // Initialize use case with mocks
    useCase = new CreateTenantUseCase(mockRepository, mockEventBus, mockValidator);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create a tenant successfully', async () => {
      // Arrange
      const dto: CreateTenantDto = {
        name: 'Test Company',
        organizationId: 'org-123',
        ownerId: 'user-123',
        plan: 'professional',
        settings: {
          timezone: 'America/New_York',
          language: 'en',
        },
      };

      mockValidator.validateCreate.mockResolvedValue(undefined);
      mockRepository.findByOrganizationId.mockResolvedValue(null);
      mockRepository.findBySlug.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe('Test Company');
      expect(result.organizationId).toBe('org-123');
      expect(result.plan.type).toBe('professional');

      expect(mockValidator.validateCreate).toHaveBeenCalledWith(dto);
      expect(mockRepository.findByOrganizationId).toHaveBeenCalledWith('org-123');
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'tenant.created',
        expect.objectContaining({
          name: 'Test Company',
          organizationId: 'org-123',
        })
      );
    });

    it('should throw error if organization already has a tenant', async () => {
      // Arrange
      const dto: CreateTenantDto = {
        name: 'Test Company',
        organizationId: 'org-123',
        ownerId: 'user-123',
      };

      const existingTenant = TestDataBuilder.createTenant({
        organizationId: 'org-123',
      });

      mockValidator.validateCreate.mockResolvedValue(undefined);
      mockRepository.findByOrganizationId.mockResolvedValue(existingTenant);

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow(
        'Tenant already exists for organization org-123'
      );

      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('should generate unique slug if name conflicts', async () => {
      // Arrange
      const dto: CreateTenantDto = {
        name: 'Test Company',
        organizationId: 'org-123',
        ownerId: 'user-123',
      };

      mockValidator.validateCreate.mockResolvedValue(undefined);
      mockRepository.findByOrganizationId.mockResolvedValue(null);

      // First call returns existing tenant, second returns null
      mockRepository.findBySlug
        .mockResolvedValueOnce(TestDataBuilder.createTenant())
        .mockResolvedValueOnce(null);

      mockRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.slug).toBe('test-company-1');
      expect(mockRepository.findBySlug).toHaveBeenCalledTimes(2);
    });

    it('should use default plan if not specified', async () => {
      // Arrange
      const dto: CreateTenantDto = {
        name: 'Test Company',
        organizationId: 'org-123',
        ownerId: 'user-123',
        // No plan specified
      };

      mockValidator.validateCreate.mockResolvedValue(undefined);
      mockRepository.findByOrganizationId.mockResolvedValue(null);
      mockRepository.findBySlug.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.plan.type).toBe('starter');
    });

    it('should handle validation errors', async () => {
      // Arrange
      const dto: CreateTenantDto = {
        name: '', // Invalid name
        organizationId: 'org-123',
        ownerId: 'user-123',
      };

      const validationError = new Error('Tenant name is required');
      mockValidator.validateCreate.mockRejectedValue(validationError);

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow('Tenant name is required');

      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      // Arrange
      const dto: CreateTenantDto = {
        name: 'Test Company',
        organizationId: 'org-123',
        ownerId: 'user-123',
      };

      mockValidator.validateCreate.mockResolvedValue(undefined);
      mockRepository.findByOrganizationId.mockResolvedValue(null);
      mockRepository.findBySlug.mockResolvedValue(null);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow('Database error');

      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });
  });

  describe('slug generation', () => {
    it('should generate slug from tenant name', async () => {
      // Arrange
      const testCases = [
        { name: 'Test Company', expectedSlug: 'test-company' },
        { name: 'My Company 123', expectedSlug: 'my-company-123' },
        { name: 'Company & Partners', expectedSlug: 'company-partners' },
        { name: 'UPPERCASE NAME', expectedSlug: 'uppercase-name' },
        { name: '  Spaces Around  ', expectedSlug: 'spaces-around' },
      ];

      for (const testCase of testCases) {
        const dto: CreateTenantDto = {
          name: testCase.name,
          organizationId: `org-${Math.random()}`,
          ownerId: 'user-123',
        };

        mockValidator.validateCreate.mockResolvedValue(undefined);
        mockRepository.findByOrganizationId.mockResolvedValue(null);
        mockRepository.findBySlug.mockResolvedValue(null);
        mockRepository.save.mockResolvedValue(undefined);

        // Act
        const result = await useCase.execute(dto);

        // Assert
        expect(result.slug).toBe(testCase.expectedSlug);
      }
    });
  });

  describe('event publishing', () => {
    it('should publish tenant.created event with correct data', async () => {
      // Arrange
      const dto: CreateTenantDto = {
        name: 'Test Company',
        organizationId: 'org-123',
        ownerId: 'user-123',
        plan: 'enterprise',
      };

      mockValidator.validateCreate.mockResolvedValue(undefined);
      mockRepository.findByOrganizationId.mockResolvedValue(null);
      mockRepository.findBySlug.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(undefined);

      // Act
      await useCase.execute(dto);

      // Assert
      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'tenant.created',
        expect.objectContaining({
          name: 'Test Company',
          organizationId: 'org-123',
          plan: 'enterprise',
          ownerId: 'user-123',
        })
      );
    });

    it('should not publish events if save fails', async () => {
      // Arrange
      const dto: CreateTenantDto = {
        name: 'Test Company',
        organizationId: 'org-123',
        ownerId: 'user-123',
      };

      mockValidator.validateCreate.mockResolvedValue(undefined);
      mockRepository.findByOrganizationId.mockResolvedValue(null);
      mockRepository.findBySlug.mockResolvedValue(null);
      mockRepository.save.mockRejectedValue(new Error('Save failed'));

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow('Save failed');
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });
  });
});
