})

describe('refreshToken', () =>
{
  it('should successfully refresh token with valid refresh token', async () => {
    // Create test user
    const testUser = await testUtils.createTestUser({ isActive: true });

    // Generate a valid refresh token
    const refreshToken = jwt.sign(
      { userId: testUser._id.toString() },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '7d' }
    );

    mockReq.body = { refreshToken };

    await authController.refreshToken(mockReq as Request, mockRes as Response);

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'Token refreshed successfully',
        data: expect.objectContaining({
          token: expect.any(String),
          refreshToken: expect.any(String),
        }),
      })
    );
  });

  it('should fail with invalid refresh token', async () => {
    mockReq.body = { refreshToken: 'invalid-token' };

    await expect(
      authController.refreshToken(mockReq as Request, mockRes as Response)
    ).rejects.toThrow('Invalid refresh token');
  });
}
)

describe('logout', () => {
  it('should successfully logout user', async () => {
    await authController.logout(mockReq as Request, mockRes as Response);

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'Logout successful',
      })
    );
  });
});

describe('updateProfile', () => {
  it('should successfully update user profile', async () => {
    const testUser = await testUtils.createTestUser({
      email: 'update@test.com',
      firstName: 'Original',
      lastName: 'Name',
    });

    mockReq.user = { id: testUser._id.toString() };
    mockReq.body = {
      firstName: 'Updated',
      lastName: 'Profile',
    };

    await authController.updateProfile(mockReq as Request, mockRes as Response);

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'Profile updated successfully',
        data: expect.objectContaining({
          user: expect.objectContaining({
            firstName: 'Updated',
            lastName: 'Profile',
          }),
        }),
      })
    );
  });

  it('should fail when not authenticated', async () => {
    mockReq.user = undefined;
    mockReq.body = {
      firstName: 'Updated',
    };

    await expect(
      authController.updateProfile(mockReq as Request, mockRes as Response)
    ).rejects.toThrow('Not authenticated');
  });
});

describe('changePassword', () => {
    it('should successfully change password', async () => {
      const testUser = await testUtils.createTestUser({
        password: await bcrypt.hash('currentpassword', 10),
      });
