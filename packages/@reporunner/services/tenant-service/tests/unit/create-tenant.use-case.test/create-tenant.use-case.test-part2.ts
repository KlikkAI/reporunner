name: 'Test Company', organizationId;
: 'org-123',
        ownerId: 'user-123'
      }

mockValidator.validateCreate.mockResolvedValue(undefined)
mockRepository.findByOrganizationId.mockResolvedValue(null)

// First call returns existing tenant, second returns null
mockRepository.findBySlug
  .mockResolvedValueOnce(TestDataBuilder.createTenant())
  .mockResolvedValueOnce(null)

mockRepository.save.mockResolvedValue(undefined);

// Act
const result = await useCase.execute(dto);

// Assert
expect(result.slug).toBe('test-company-1');
expect(mockRepository.findBySlug).toHaveBeenCalledTimes(2);
})

it('should use default plan if not specified', async () =>
{
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
}
)

it('should handle validation errors', async () =>
{
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
}
)

it('should handle repository errors', async () =>
{
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
}
)
})

describe('slug generation', () =>
{
    it('should generate slug from tenant name', async () => {
      // Arrange
      const testCases = [
        { name: 'Test Company', expectedSlug: 'test-company' },
        { name: 'My Company 123', expectedSlug: 'my-company-123' },
        { name: 'Company & Partners', expectedSlug: 'company-partners' },
        { name: 'UPPERCASE NAME', expectedSlug: 'uppercase-name' },
        { name: '  Spaces Around  ', expectedSlug: 'spaces-around' }
      ];

      for (const testCase of testCases) {
        const dto: CreateTenantDto = {
          name: testCase.name,
          organizationId: `org-${Math.random()}`,
          ownerId: 'user-123'
        };
