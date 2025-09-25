expect(mockRes.status).toHaveBeenCalledWith(401);
expect(mockRes.json).toHaveBeenCalledWith(
  expect.objectContaining({
    success: false,
    message: 'Invalid token',
  })
);

expect(mockNext).not.toHaveBeenCalled();
expect(mockReq.user).toBeUndefined();
})

it('should reject request with expired token', async () =>
{
  const testUser = await testUtils.createTestUser();

  // Create expired token
  const expiredToken = jwt.sign(
    { userId: testUser._id.toString() },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '-1h' } // Already expired
  );

  mockReq.headers!.authorization = `Bearer ${expiredToken}`;

  await authenticate(mockReq as Request, mockRes as Response, mockNext);

  expect(mockRes.status).toHaveBeenCalledWith(401);
  expect(mockRes.json).toHaveBeenCalledWith(
    expect.objectContaining({
      success: false,
      message: 'Invalid token',
    })
  );

  expect(mockNext).not.toHaveBeenCalled();
  expect(mockReq.user).toBeUndefined();
}
)

it('should reject request when user not found in database', async () => {
  // Create token for non-existent user
  const nonExistentUserId = '507f1f77bcf86cd799439011';
  const token = jwt.sign({ userId: nonExistentUserId }, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1h',
  });

  mockReq.headers!.authorization = `Bearer ${token}`;

  await authenticate(mockReq as Request, mockRes as Response, mockNext);

  expect(mockRes.status).toHaveBeenCalledWith(401);
  expect(mockRes.json).toHaveBeenCalledWith(
    expect.objectContaining({
      success: false,
      message: 'Invalid token',
    })
  );

  expect(mockNext).not.toHaveBeenCalled();
  expect(mockReq.user).toBeUndefined();
});

it('should handle token with wrong JWT secret', async () => {
  const testUser = await testUtils.createTestUser();

  // Create token with wrong secret
  const wrongSecretToken = jwt.sign({ userId: testUser._id.toString() }, 'wrong-secret', {
    expiresIn: '1h',
  });

  mockReq.headers!.authorization = `Bearer ${wrongSecretToken}`;

  await authenticate(mockReq as Request, mockRes as Response, mockNext);

  expect(mockRes.status).toHaveBeenCalledWith(401);
  expect(mockRes.json).toHaveBeenCalledWith(
    expect.objectContaining({
      success: false,
      message: 'Invalid token',
    })
  );

  expect(mockNext).not.toHaveBeenCalled();
  expect(mockReq.user).toBeUndefined();
});

it('should work with token without Bearer prefix (legacy support)', async () => {
      const testUser = await testUtils.createTestUser({
        email: 'legacy@test.com',
      });

      const token = jwt.sign(
        { userId: testUser._id.toString() },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

// Set token directly without Bearer prefix
