})

it('should fail with incorrect current password', async () =>
{
  const testUser = await testUtils.createTestUser({
    password: await bcrypt.hash('correctpass', 10),
  });

  const token = await testUtils.generateTestToken(testUser._id.toString());

  const response = await request(app)
    .put('/auth/change-password')
    .set('Authorization', `Bearer ${token}`)
    .send({
      currentPassword: 'wrongpass',
      newPassword: 'newpass123',
    })
    .expect(400);

  expect(response.body).toEqual(
    expect.objectContaining({
      success: false,
      message: 'Current password is incorrect',
    })
  );
}
)

it('should fail without authentication', async () => {
  const response = await request(app)
    .put('/auth/change-password')
    .send({
      currentPassword: 'current',
      newPassword: 'new',
    })
    .expect(401);

  expect(response.body).toEqual(
    expect.objectContaining({
      success: false,
      message: 'Access token is required',
    })
  );
});

it('should fail with weak new password', async () => {
  const testUser = await testUtils.createTestUser({
    password: await bcrypt.hash('currentpass', 10),
  });

  const token = await testUtils.generateTestToken(testUser._id.toString());

  const response = await request(app)
    .put('/auth/change-password')
    .set('Authorization', `Bearer ${token}`)
    .send({
      currentPassword: 'currentpass',
      newPassword: '123', // Too weak
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

describe('Authentication Flow Integration', () =>
{
    it('should complete full registration -> login -> profile -> update -> logout flow', async () => {
      // 1. Register new user
      const registerResponse = await request(app)
        .post('/auth/register')
        .send({
          firstName: 'Flow',
          lastName: 'Test',
          email: 'flow@test.com',
          password: 'Password123',
        })
        .expect(201);

      const { token: registerToken, refreshToken } = registerResponse.body.data;

      // 2. Get profile with registration token
      const profileResponse = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${registerToken}`)
        .expect(200);

      expect(profileResponse.body.data.user.email).toBe('flow@test.com');

      // 3. Update profile
      await request(app)
        .put('/auth/profile')
        .set('Authorization', `Bearer ${registerToken}`)
        .send({
          firstName: 'Updated Flow',
        })
        .expect(200);
