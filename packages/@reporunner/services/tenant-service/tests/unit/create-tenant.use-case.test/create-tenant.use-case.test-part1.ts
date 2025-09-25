import { CreateTenantUseCase } from '../../src/refactored/application/use-cases/create-tenant.use-case';
import { TenantRepository } from '../../src/refactored/domain/repositories/tenant.repository';
import { EventBus } from '../../src/refactored/domain/services/event-bus';
import { TenantValidator } from '../../src/refactored/application/validators/tenant.validator';
import { CreateTenantDto } from '../../src/refactored/application/dto/create-tenant.dto';
import { MockFactory, TestDataBuilder } from '@reporunner/testing/setup/test-setup';

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
      validateCreate: jest.fn()
    } as any;

    // Initialize use case with mocks
    useCase = new CreateTenantUseCase(
      mockRepository,
      mockEventBus,
      mockValidator
    );
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
          language: 'en'
        }
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
          organizationId: 'org-123'
        })
      );
    });

    it('should throw error if organization already has a tenant', async () => {
      // Arrange
      const dto: CreateTenantDto = {
        name: 'Test Company',
        organizationId: 'org-123',
        ownerId: 'user-123'
      };

      const existingTenant = TestDataBuilder.createTenant({
        organizationId: 'org-123'
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
