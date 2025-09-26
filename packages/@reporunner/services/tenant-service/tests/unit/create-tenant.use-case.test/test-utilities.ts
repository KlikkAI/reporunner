mockValidator.validateCreate.mockResolvedValue(undefined);
mockRepository.findByOrganizationId.mockResolvedValue(null);
mockRepository.findBySlug.mockResolvedValue(null);
mockRepository.save.mockResolvedValue(undefined);

// Act
const result = await useCase.execute(dto);

// Assert
expect(result.slug).toBe(testCase.expectedSlug);
}
    })
})

describe('event publishing', () =>
{
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
}
)
})
