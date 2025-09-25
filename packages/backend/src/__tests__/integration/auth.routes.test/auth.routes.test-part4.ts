message: 'Invalid token',
})
      )
})

it('should fail with expired token', async () =>
{
  const testUser = await testUtils.createTestUser();

  // Create expired token
  const expiredToken = jwt.sign(
    { userId: testUser._id.toString() },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '-1h' }
  );

  const response = await request(app)
    .get('/auth/profile')
    .set('Authorization', `Bearer ${expiredToken}`)
    .expect(401);

  expect(response.body).toEqual(
    expect.objectContaining({
      success: false,
      message: 'Invalid token',
    })
  );
}
)

it('should fail when user no longer exists', async () => {
  // Create and then delete user
  const testUser = await testUtils.createTestUser();
  const token = await testUtils.generateTestToken(testUser._id.toString());
  await User.findByIdAndDelete(testUser._id);

  const response = await request(app)
    .get('/auth/profile')
    .set('Authorization', `Bearer ${token}`)
    .expect(401);

  expect(response.body).toEqual(
    expect.objectContaining({
      success: false,
      message: 'Invalid token',
    })
  );
});
})

describe('GET /auth/me', () =>
{
  it('should get user profile with valid token (alternative endpoint)', async () => {
    const testUser = await testUtils.createTestUser({
      email: 'me@test.com',
    });

    const token = await testUtils.generateTestToken(testUser._id.toString());

    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          user: expect.objectContaining({
            id: testUser._id.toString(),
            email: 'me@test.com',
          }),
        }),
      })
    );
  });
}
)

describe('POST /auth/refresh', () => {
    it('should refresh token successfully', async () => {
      // Create test user
      const testUser = await testUtils.createTestUser({ isActive: true });

      // Generate valid refresh token
      const refreshToken = jwt.sign(
        { userId: testUser._id.toString() },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '7d' }
      );

      const response = await request(app).post('/auth/refresh').send({ refreshToken }).expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: 'Token refreshed successfully',
          data: expect.objectContaining({
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
          }),
        })
      );
