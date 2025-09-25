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
      const _testUser = await testUtils.createTestUser({
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
