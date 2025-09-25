expect.objectContaining({
  success: false,
  message: 'Invalid email or password',
});
)
})

it('should fail with inactive user', async () =>
{
  const _testUser = await testUtils.createTestUser({
    email: 'inactive@test.com',
    password: await bcrypt.hash('password123', 10),
    isActive: false,
  });

  const response = await request(app)
    .post('/auth/login')
    .send({
      email: 'inactive@test.com',
      password: 'Password123',
    })
    .expect(401);

  expect(response.body).toEqual(
    expect.objectContaining({
      success: false,
      message: 'Invalid email or password',
    })
  );
}
)

it('should fail with missing credentials', async () => {
  const response = await request(app)
    .post('/auth/login')
    .send({
      email: 'test@test.com',
      // Missing password
    })
    .expect(400);

  expect(response.body).toEqual(
    expect.objectContaining({
      success: false,
      message: expect.stringMatching(/Validation failed|validation/i),
    })
  );
});
})

describe('GET /auth/profile', () =>
{
    it('should get user profile with valid token', async () => {
      // Create test user
      const testUser = await testUtils.createTestUser({
        email: 'profile@test.com',
        firstName: 'Profile',
        lastName: 'User',
      });

      // Generate valid token
      const token = await testUtils.generateTestToken(testUser._id.toString());

      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({
              id: testUser._id.toString(),
              email: 'profile@test.com',
              firstName: 'Profile',
              lastName: 'User',
            }),
          }),
        })
      );
    });

    it('should fail without authorization token', async () => {
      const response = await request(app).get('/auth/profile').expect(401);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'Access token is required',
        })
      );
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
