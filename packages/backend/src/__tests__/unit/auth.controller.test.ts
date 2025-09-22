import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthController } from '../../domains/auth/controllers/AuthController.js';
import { AuthService } from '../../domains/auth/services/AuthService.js';
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
        password: await bcrypt.hash('password123', 10),
        isActive: false,
      });

      mockReq.body = {
        email: 'inactive@test.com',
        password: 'password123',
      };

      await expect(authController.login(mockReq as Request, mockRes as Response)).rejects.toThrow(
        'Invalid email or password'
      );
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      mockReq.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'newuser@test.com',
        password: 'password123',
      };

      await authController.register(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User registered successfully',
          data: expect.objectContaining({
            user: expect.objectContaining({
              email: 'newuser@test.com',
              firstName: 'John',
              lastName: 'Doe',
            }),
            token: expect.any(String),
            refreshToken: expect.any(String),
          }),
        })
      );

      // Verify user exists in database
      const createdUser = await User.findOne({ email: 'newuser@test.com' });
      expect(createdUser).toBeTruthy();
      expect(createdUser?.firstName).toBe('John');
      expect(createdUser?.lastName).toBe('Doe');
    });

    it('should fail registration with existing email', async () => {
      // Create existing user
      await testUtils.createTestUser({ email: 'existing@test.com' });

      mockReq.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@test.com',
        password: 'password123',
      };

      await expect(
        authController.register(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('User already exists with this email');
    });
  });

  describe('getProfile', () => {
    it('should return user profile for authenticated user', async () => {
      // Create test user
      const testUser = await testUtils.createTestUser();

      // Mock authenticated request
      mockReq.user = { id: testUser._id.toString() };

      await authController.getProfile(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({
              id: testUser._id.toString(),
              email: testUser.email,
              firstName: testUser.firstName,
              lastName: testUser.lastName,
            }),
          }),
        })
      );
    });

    it('should fail when user not found', async () => {
      // Mock request with non-existent user ID
      mockReq.user = { id: '507f1f77bcf86cd799439011' };

      await expect(
        authController.getProfile(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('User not found');
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token with valid refresh token', async () => {
      // Create test user
      const testUser = await testUtils.createTestUser({ isActive: true });

      // Generate a valid refresh token
      const refreshToken = jwt.sign(
        { userId: testUser._id.toString() },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '7d' }
      );

      mockReq.body = { refreshToken };

      await authController.refreshToken(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Token refreshed successfully',
          data: expect.objectContaining({
            token: expect.any(String),
            refreshToken: expect.any(String),
          }),
        })
      );
    });

    it('should fail with invalid refresh token', async () => {
      mockReq.body = { refreshToken: 'invalid-token' };

      await expect(
        authController.refreshToken(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      await authController.logout(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Logout successful',
        })
      );
    });
  });

  describe('updateProfile', () => {
    it('should successfully update user profile', async () => {
      const testUser = await testUtils.createTestUser({
        email: 'update@test.com',
        firstName: 'Original',
        lastName: 'Name',
      });

      mockReq.user = { id: testUser._id.toString() };
      mockReq.body = {
        firstName: 'Updated',
        lastName: 'Profile',
      };

      await authController.updateProfile(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Profile updated successfully',
          data: expect.objectContaining({
            user: expect.objectContaining({
              firstName: 'Updated',
              lastName: 'Profile',
            }),
          }),
        })
      );
    });

    it('should fail when not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.body = {
        firstName: 'Updated',
      };

      await expect(
        authController.updateProfile(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('changePassword', () => {
    it('should successfully change password', async () => {
      const testUser = await testUtils.createTestUser({
        password: await bcrypt.hash('currentpassword', 10),
      });

      mockReq.user = { id: testUser._id.toString() };
      mockReq.body = {
        currentPassword: 'currentpassword',
        newPassword: 'newpassword123',
      };

      await authController.changePassword(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Password changed successfully',
        })
      );
    });

    it('should fail when not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.body = {
        currentPassword: 'current',
        newPassword: 'new',
      };

      await expect(
        authController.changePassword(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Not authenticated');
    });

    it('should fail with incorrect current password', async () => {
      const testUser = await testUtils.createTestUser({
        password: await bcrypt.hash('correctpassword', 10),
      });

      mockReq.user = { id: testUser._id.toString() };
      mockReq.body = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
      };

      await expect(
        authController.changePassword(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Current password is incorrect');
    });
  });
});
