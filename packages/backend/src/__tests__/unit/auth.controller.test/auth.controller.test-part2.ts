password: await bcrypt.hash('password123', 10), isActive;
: false,
      })

mockReq.body =
{
  email: 'inactive@test.com', password;
  : 'password123',
}

await expect(authController.login(mockReq as Request, mockRes as Response)).rejects.toThrow(
  'Invalid email or password'
);
})
})

describe('register', () =>
{
  it('should successfully register a new user', async () => {
    mockReq.body = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'newuser@test.com',
      password: 'password123',
    };

    await authController.register(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'User registered successfully',
        data: expect.objectContaining({
          user: expect.objectContaining({
            email: 'newuser@test.com',
            firstName: 'John',
            lastName: 'Doe',
          }),
          token: expect.any(String),
          refreshToken: expect.any(String),
        }),
      })
    );

    // Verify user exists in database
    const createdUser = await User.findOne({ email: 'newuser@test.com' });
    expect(createdUser).toBeTruthy();
    expect(createdUser?.firstName).toBe('John');
    expect(createdUser?.lastName).toBe('Doe');
  });

  it('should fail registration with existing email', async () => {
    // Create existing user
    await testUtils.createTestUser({ email: 'existing@test.com' });

    mockReq.body = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'existing@test.com',
      password: 'password123',
    };

    await expect(authController.register(mockReq as Request, mockRes as Response)).rejects.toThrow(
      'User already exists with this email'
    );
  });
}
)

describe('getProfile', () =>
{
    it('should return user profile for authenticated user', async () => {
      // Create test user
      const testUser = await testUtils.createTestUser();

      // Mock authenticated request
      mockReq.user = { id: testUser._id.toString() };

      await authController.getProfile(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({
              id: testUser._id.toString(),
              email: testUser.email,
              firstName: testUser.firstName,
              lastName: testUser.lastName,
            }),
          }),
        })
      );
    });

    it('should fail when user not found', async () => {
      // Mock request with non-existent user ID
      mockReq.user = { id: '507f1f77bcf86cd799439011' };

      await expect(
        authController.getProfile(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('User not found');
    });
