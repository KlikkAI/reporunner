mockReq.headers!.authorization = token;

await authenticate(mockReq as Request, mockRes as Response, mockNext);

expect(mockReq.user).toEqual(
  expect.objectContaining({
    id: testUser._id.toString(),
    email: 'legacy@test.com',
  })
);

expect(mockNext).toHaveBeenCalled();
expect(mockRes.status).not.toHaveBeenCalled();
})

it('should handle case-insensitive Bearer prefix', async () =>
{
  const testUser = await testUtils.createTestUser({
    email: 'bearer@test.com',
  });

  const token = jwt.sign(
    { userId: testUser._id.toString() },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );

  // Test with lowercase 'bearer'
  mockReq.headers!.authorization = `bearer ${token}`;

  await authenticate(mockReq as Request, mockRes as Response, mockNext);

  expect(mockReq.user).toEqual(
    expect.objectContaining({
      id: testUser._id.toString(),
      email: 'bearer@test.com',
    })
  );

  expect(mockNext).toHaveBeenCalled();
  expect(mockRes.status).not.toHaveBeenCalled();
}
)

it('should not expose sensitive user data in request.user', async () =>
{
  const testUser = await testUtils.createTestUser({
    email: 'sensitive@test.com',
  });

  const token = jwt.sign(
    { userId: testUser._id.toString() },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );

  mockReq.headers!.authorization = `Bearer ${token}`;

  await authenticate(mockReq as Request, mockRes as Response, mockNext);

  // Verify sensitive data is not exposed
  expect(mockReq.user).not.toHaveProperty('password');
  expect(mockReq.user).not.toHaveProperty('emailVerificationToken');
  expect(mockReq.user).not.toHaveProperty('resetPasswordToken');

  // Verify safe data is exposed
  expect(mockReq.user).toHaveProperty('id');
  expect(mockReq.user).toHaveProperty('email');
  expect(mockReq.user).toHaveProperty('firstName');
  expect(mockReq.user).toHaveProperty('lastName');
}
)

it('should handle database connection errors gracefully', async () =>
{
  const testUser = await testUtils.createTestUser();
  const token = jwt.sign(
    { userId: testUser._id.toString() },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );

  mockReq.headers!.authorization = `Bearer ${token}`;

  // Mock database error
  const originalFindById = User.findById;
  User.findById = vi.fn().mockRejectedValue(new Error('Database connection failed'));

  await authenticate(mockReq as Request, mockRes as Response, mockNext);

  expect(mockRes.status).toHaveBeenCalledWith(401);
  expect(mockRes.json).toHaveBeenCalledWith(
    expect.objectContaining({
      success: false,
      message: 'Invalid token',
    })
  );

  expect(mockNext).not.toHaveBeenCalled();

  // Restore original method
  User.findById = originalFindById;
}
)
})
})
