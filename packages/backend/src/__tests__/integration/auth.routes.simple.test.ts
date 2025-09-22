import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../../app.js';
import { User } from '../../models/User.js';
import { testUtils } from '../setup.js';

describe('Auth Routes Simple Integration Tests', () => {
  describe('POST /auth/register', () => {
    it('should register a new user successfully with strong password', async () => {
      const userData = {
        firstName: 'Integration',
        lastName: 'Test',
        email: 'integration@test.com',
        password: 'Password123', // Strong password: uppercase, lowercase, number
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
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      // Create test user with strong password
      const testUser = await testUtils.createTestUser({
        email: 'login@integration.com',
        password: 'Password123',
        isActive: true,
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@integration.com',
          password: 'Password123',
        })
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: 'Login successful',
          data: expect.objectContaining({
            user: expect.objectContaining({
              email: 'login@integration.com',
            }),
            token: expect.any(String),
            refreshToken: expect.any(String),
          }),
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
              email: 'profile@test.com',
              firstName: 'Profile',
              lastName: 'User',
            }),
          }),
        })
      );
    });
  });

  describe('POST /auth/refresh (correct endpoint)', () => {
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
  });

  describe('PUT /auth/change-password (correct method)', () => {
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
  });

  describe('Complete Authentication Flow', () => {
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

      // 5. Login with registered user
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'flow@test.com',
          password: 'FlowTest123',
        })
        .expect(200);

      expect(loginResponse.body.data.user.email).toBe('flow@test.com');
    });
  });
});
