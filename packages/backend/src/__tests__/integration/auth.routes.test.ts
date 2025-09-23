import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../../app.js';
import { User } from '../../models/User.js';
import { testUtils } from '../setup.js';

describe('Auth Routes Integration Tests', () => {
  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        firstName: 'Integration',
        lastName: 'Test',
        email: 'integration@test.com',
        password: 'Password123',
      };

      const response = await request(app).post('/auth/register').send(userData).expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: 'User registered successfully',
          data: expect.objectContaining({
            user: expect.objectContaining({
              email: 'integration@test.com',
              firstName: 'Integration',
              lastName: 'Test',
              fullName: 'Integration Test',
              role: 'user',
            }),
            token: expect.any(String),
            refreshToken: expect.any(String),
          }),
        })
      );

      // Verify user is created in database
      const createdUser = await User.findOne({ email: 'integration@test.com' });
      expect(createdUser).toBeTruthy();
      expect(createdUser?.firstName).toBe('Integration');
      expect(createdUser?.lastName).toBe('Test');
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          firstName: 'Test',
          email: 'incomplete@test.com',
          // Missing lastName and password
        })
        .expect(400);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/Validation failed|validation/i),
        })
      );
    });

    it('should fail with duplicate email', async () => {
      // Create existing user
      await testUtils.createTestUser({ email: 'duplicate@test.com' });

      const response = await request(app)
        .post('/auth/register')
        .send({
          firstName: 'Duplicate',
          lastName: 'User',
          email: 'duplicate@test.com',
          password: 'Password123',
        })
        .expect(409);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'User already exists with this email',
        })
      );
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          firstName: 'Invalid',
          lastName: 'Email',
          email: 'invalid-email-format',
          password: 'Password123',
        })
        .expect(400);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/Validation failed|validation/i),
        })
      );
    });

    it('should fail with weak password', async () => {
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
    });
  });

  describe('POST /auth/login', () => {
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
        expect.objectContaining({
          success: false,
          message: 'Invalid email or password',
        })
      );
    });

    it('should fail with inactive user', async () => {
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
    });

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
  });

  describe('GET /auth/profile', () => {
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
          message: 'Invalid token',
        })
      );
    });

    it('should fail with expired token', async () => {
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
    });

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
  });

  describe('GET /auth/me', () => {
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
  });

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
    });

    it('should fail with invalid refresh token', async () => {
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
    });

    it('should fail with missing refresh token', async () => {
      const response = await request(app).post('/auth/refresh').send({}).expect(400);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/Validation failed|validation/i),
        })
      );
    });

    it('should fail when user is inactive', async () => {
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
    });
  });

  describe('POST /auth/logout', () => {
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
  });

  describe('PUT /auth/profile', () => {
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
        })
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: 'Profile updated successfully',
          data: expect.objectContaining({
            user: expect.objectContaining({
              firstName: 'Updated',
              lastName: 'Profile',
              fullName: 'Updated Profile',
            }),
          }),
        })
      );

      // Verify database is updated
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.firstName).toBe('Updated');
      expect(updatedUser?.lastName).toBe('Profile');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put('/auth/profile')
        .send({
          firstName: 'Updated',
        })
        .expect(401);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'Access token is required',
        })
      );
    });

    it('should handle partial updates', async () => {
      const testUser = await testUtils.createTestUser({
        firstName: 'Original',
        lastName: 'Name',
      });

      const token = await testUtils.generateTestToken(testUser._id.toString());

      const response = await request(app)
        .put('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'OnlyFirstName',
          // lastName not provided
        })
        .expect(200);

      expect(response.body.data.user.firstName).toBe('OnlyFirstName');
      expect(response.body.data.user.lastName).toBe('Name'); // Should remain unchanged
    });
  });

  describe('POST /auth/change-password', () => {
    it('should change password successfully', async () => {
      const currentPassword = 'currentpass123';
      const newPassword = 'newpass123';

      const testUser = await testUtils.createTestUser({
        password: await bcrypt.hash(currentPassword, 10),
      });

      const token = await testUtils.generateTestToken(testUser._id.toString());

      const response = await request(app)
        .put('/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword,
          newPassword,
        })
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: 'Password changed successfully',
        })
      );

      // Verify password is changed in database
      const updatedUser = await User.findById(testUser._id).select('+password');
      expect(updatedUser).toBeTruthy();

      const isNewPasswordValid = await bcrypt.compare(newPassword, updatedUser?.password || '');
      expect(isNewPasswordValid).toBe(true);

      const isOldPasswordInvalid = await bcrypt.compare(
        currentPassword,
        updatedUser?.password || ''
      );
      expect(isOldPasswordInvalid).toBe(false);
    });

    it('should fail with incorrect current password', async () => {
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
    });

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
  });

  describe('Authentication Flow Integration', () => {
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

      // 4. Refresh token
      const refreshResponse = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      const { accessToken: newToken } = refreshResponse.body.data;

      // 5. Use new token to access profile
      const newProfileResponse = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(newProfileResponse.body.data.user.firstName).toBe('Updated Flow');

      // 6. Login with updated user
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'flow@test.com',
          password: 'Password123',
        })
        .expect(200);

      expect(loginResponse.body.data.user.firstName).toBe('Updated Flow');

      // 7. Logout
      await request(app).post('/auth/logout').expect(200);
    });
  });
});
