import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthController } from '../../domains/auth/controllers/AuthController.js';
import { User } from '../../models/User.js';
import { testUtils } from '../setup.js';

describe('AuthController', () => {
  let authController: AuthController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    authController = new AuthController();

    // Mock Express request and response objects
    mockReq = {
      body: {},
      headers: {},
      user: undefined,
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis(),
      clearCookie: vi.fn().mockReturnThis(),
    };
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // Create a test user
      const testUser = await testUtils.createTestUser({
        email: 'login@test.com',
        password: await bcrypt.hash('password123', 10),
        isActive: true,
      });

      // Set request body
      mockReq.body = {
        email: 'login@test.com',
        password: 'password123',
      };

      // Execute login
      await authController.login(mockReq as Request, mockRes as Response);

      // Verify response
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Login successful',
          data: expect.objectContaining({
            user: expect.objectContaining({
              id: testUser._id.toString(),
              email: 'login@test.com',
              firstName: 'Test',
              lastName: 'User',
            }),
            token: expect.any(String),
            refreshToken: expect.any(String),
          }),
        })
      );
    });

    it('should fail login with invalid email', async () => {
      mockReq.body = {
        email: 'nonexistent@test.com',
        password: 'password123',
      };

      await expect(authController.login(mockReq as Request, mockRes as Response)).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should fail login with invalid password', async () => {
      // Create a test user
      await testUtils.createTestUser({
        email: 'login@test.com',
        password: await bcrypt.hash('password123', 10),
      });

      mockReq.body = {
        email: 'login@test.com',
        password: 'wrongpassword',
      };

      await expect(authController.login(mockReq as Request, mockRes as Response)).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should fail login with inactive user', async () => {
      // Create inactive user
      await testUtils.createTestUser({
        email: 'inactive@test.com',
