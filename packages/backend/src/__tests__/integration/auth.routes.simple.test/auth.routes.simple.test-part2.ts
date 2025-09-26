}),
          }),
        })
      )
})
})

describe('POST /auth/refresh (correct endpoint)', () =>
{
  it('should refresh token successfully', async () => {
    // Create test user
    const testUser = await testUtils.createTestUser({ isActive: true });

    // Generate valid refresh token using the same secret as the service
    const jwt = await import('jsonwebtoken');
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
  });
}
)

describe('PUT /auth/change-password (correct method)', () =>
{
  it('should change password successfully', async () => {
    const testUser = await testUtils.createTestUser({
      password: 'CurrentPass123', // Strong password
    });

    const token = await testUtils.generateTestToken(testUser._id.toString());

    const response = await request(app)
      .put('/auth/change-password') // PUT not POST
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'CurrentPass123',
        newPassword: 'NewPassword123', // Strong password
      })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: 'Password changed successfully',
      })
    );
  });
}
)

describe('Complete Authentication Flow', () =>
{
    it('should complete register -> login -> profile -> refresh flow', async () => {
      // 1. Register new user
      const registerResponse = await request(app)
        .post('/auth/register')
        .send({
          firstName: 'Flow',
          lastName: 'Test',
          email: 'flow@test.com',
          password: 'FlowTest123',
        })
        .expect(201);

      const { token: registerToken, refreshToken } = registerResponse.body.data;

      // 2. Get profile with registration token
      const profileResponse = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${registerToken}`)
        .expect(200);

      expect(profileResponse.body.data.user.email).toBe('flow@test.com');

      // 3. Refresh token
      const refreshResponse = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      const { accessToken: newToken } = refreshResponse.body.data;

      // 4. Use new token to access profile
      const newProfileResponse = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(newProfileResponse.body.data.user.email).toBe('flow@test.com');
