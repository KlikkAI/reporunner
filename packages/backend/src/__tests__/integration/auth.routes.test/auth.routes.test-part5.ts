// Verify tokens are valid strings
expect(response.body.data.accessToken).toBeDefined();
expect(typeof response.body.data.accessToken).toBe('string');
expect(response.body.data.refreshToken).toBeDefined();
expect(typeof response.body.data.refreshToken).toBe('string');

// Verify new token is valid
const decodedToken = jwt.verify(
  response.body.data.accessToken,
  process.env.JWT_SECRET || 'test-secret'
) as any;
expect(decodedToken.userId).toBe(testUser._id.toString());
})

it('should fail with invalid refresh token', async () =>
{
  const response = await request(app)
    .post('/auth/refresh')
    .send({ refreshToken: 'invalid-token' })
    .expect(401);

  expect(response.body).toEqual(
    expect.objectContaining({
      success: false,
      message: 'Invalid refresh token',
    })
  );
}
)

it('should fail with missing refresh token', async () =>
{
  const response = await request(app).post('/auth/refresh').send({}).expect(400);

  expect(response.body).toEqual(
    expect.objectContaining({
      success: false,
      message: expect.stringMatching(/Validation failed|validation/i),
    })
  );
}
)

it('should fail when user is inactive', async () =>
{
  const testUser = await testUtils.createTestUser({ isActive: false });

  const refreshToken = jwt.sign(
    { userId: testUser._id.toString() },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '7d' }
  );

  const response = await request(app).post('/auth/refresh').send({ refreshToken }).expect(401);

  expect(response.body).toEqual(
    expect.objectContaining({
      success: false,
      message: 'Invalid refresh token',
    })
  );
}
)
})

describe('POST /auth/logout', () =>
{
  it('should logout successfully', async () => {
    const response = await request(app).post('/auth/logout').expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: 'Logout successful',
      })
    );
  });

  it('should logout successfully even without authentication', async () => {
    // Logout should work even if user isn't authenticated
    const response = await request(app).post('/auth/logout').expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: 'Logout successful',
      })
    );
  });
}
)

describe('PUT /auth/profile', () =>
{
    it('should update profile successfully', async () => {
      const testUser = await testUtils.createTestUser({
        email: 'update@test.com',
        firstName: 'Original',
        lastName: 'Name',
      });

      const token = await testUtils.generateTestToken(testUser._id.toString());

      const response = await request(app)
        .put('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Updated',
          lastName: 'Profile',
