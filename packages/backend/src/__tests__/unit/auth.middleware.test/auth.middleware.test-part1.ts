import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticate } from '../../middleware/auth.js';
import { User } from '../../models/User.js';
import { testUtils } from '../setup.js';

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
      user: undefined,
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  describe('authenticate middleware', () => {
    it('should authenticate user with valid Bearer token', async () => {
      // Create test user
      const testUser = await testUtils.createTestUser({
        email: 'middleware@test.com',
      });

      // Generate valid token
      const token = jwt.sign(
        { userId: testUser._id.toString() },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      // Set authorization header
      mockReq.headers!.authorization = `Bearer ${token}`;

      // Execute middleware
      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      // Verify user is attached to request
      expect(mockReq.user).toEqual(
        expect.objectContaining({
          id: testUser._id.toString(),
          email: 'middleware@test.com',
          firstName: 'Test',
          lastName: 'User',
        })
      );

      // Verify next() was called
      expect(mockNext).toHaveBeenCalled();

      // Verify no error response
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should reject request with no authorization header', async () => {
      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Access token is required',
        })
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });

    it('should reject request with malformed authorization header', async () => {
      mockReq.headers!.authorization = 'Invalid header format';

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Access token is required',
        })
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });

    it('should reject request with invalid token', async () => {
      mockReq.headers!.authorization = 'Bearer invalid-token';

      await authenticate(mockReq as Request, mockRes as Response, mockNext);
