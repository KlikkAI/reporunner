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
