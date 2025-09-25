})
      )
})

it('should fail with weak password', async () =>
{
  const response = await request(app)
    .post('/auth/register')
    .send({
      firstName: 'Weak',
      lastName: 'Password',
      email: 'weak@test.com',
      password: '123', // Too short
    })
    .expect(400);

  expect(response.body).toEqual(
    expect.objectContaining({
      success: false,
      message: expect.stringMatching(/Validation failed|validation/i),
    })
  );
}
)
})

describe('POST /auth/login', () =>
{
    it('should login successfully with valid credentials', async () => {
      // Create test user
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      const testUser = await testUtils.createTestUser({
        email: 'login@integration.com',
        password: hashedPassword,
        isActive: true,
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@integration.com',
          password: password,
        })
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: 'Login successful',
          data: expect.objectContaining({
            user: expect.objectContaining({
              id: testUser._id.toString(),
              email: 'login@integration.com',
              firstName: 'Test',
              lastName: 'User',
            }),
            token: expect.any(String),
            refreshToken: expect.any(String),
          }),
        })
      );

      // Verify JWT token is valid
      const decodedToken = jwt.verify(
        response.body.data.token,
        process.env.JWT_SECRET || 'test-secret'
      ) as any;
      expect(decodedToken.userId).toBe(testUser._id.toString());
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Password123',
        })
        .expect(401);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'Invalid email or password',
        })
      );
    });

    it('should fail with incorrect password', async () => {
      const _testUser = await testUtils.createTestUser({
        email: 'wrongpass@test.com',
        password: await bcrypt.hash('correctpassword', 10),
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'wrongpass@test.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toEqual(
