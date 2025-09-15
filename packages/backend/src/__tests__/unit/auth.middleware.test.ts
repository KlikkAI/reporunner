import { describe, it, expect, beforeEach, vi } from 'vitest'
import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { User } from '../../models/User.js'
import { testUtils } from '../setup.js'

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    mockReq = {
      headers: {},
      user: undefined
    }

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    }

    mockNext = vi.fn()
  })

  describe('authenticate middleware', () => {
    it('should authenticate user with valid Bearer token', async () => {
      // Create test user
      const testUser = await testUtils.createTestUser({
        email: 'middleware@test.com'
      })

      // Generate valid token
      const token = jwt.sign(
        { userId: testUser._id.toString() },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      )

      // Set authorization header
      mockReq.headers!.authorization = `Bearer ${token}`

      // Execute middleware
      await authenticate(mockReq as Request, mockRes as Response, mockNext)

      // Verify user is attached to request
      expect(mockReq.user).toEqual(
        expect.objectContaining({
          id: testUser._id.toString(),
          email: 'middleware@test.com',
          firstName: 'Test',
          lastName: 'User'
        })
      )

      // Verify next() was called
      expect(mockNext).toHaveBeenCalled()

      // Verify no error response
      expect(mockRes.status).not.toHaveBeenCalled()
      expect(mockRes.json).not.toHaveBeenCalled()
    })

    it('should reject request with no authorization header', async () => {
      await authenticate(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Access token is required'
        })
      )

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockReq.user).toBeUndefined()
    })

    it('should reject request with malformed authorization header', async () => {
      mockReq.headers!.authorization = 'Invalid header format'

      await authenticate(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Access token is required'
        })
      )

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockReq.user).toBeUndefined()
    })

    it('should reject request with invalid token', async () => {
      mockReq.headers!.authorization = 'Bearer invalid-token'

      await authenticate(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid token'
        })
      )

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockReq.user).toBeUndefined()
    })

    it('should reject request with expired token', async () => {
      const testUser = await testUtils.createTestUser()

      // Create expired token
      const expiredToken = jwt.sign(
        { userId: testUser._id.toString() },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' } // Already expired
      )

      mockReq.headers!.authorization = `Bearer ${expiredToken}`

      await authenticate(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid token'
        })
      )

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockReq.user).toBeUndefined()
    })

    it('should reject request when user not found in database', async () => {
      // Create token for non-existent user
      const nonExistentUserId = '507f1f77bcf86cd799439011'
      const token = jwt.sign(
        { userId: nonExistentUserId },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      )

      mockReq.headers!.authorization = `Bearer ${token}`

      await authenticate(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid token'
        })
      )

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockReq.user).toBeUndefined()
    })

    it('should handle token with wrong JWT secret', async () => {
      const testUser = await testUtils.createTestUser()

      // Create token with wrong secret
      const wrongSecretToken = jwt.sign(
        { userId: testUser._id.toString() },
        'wrong-secret',
        { expiresIn: '1h' }
      )

      mockReq.headers!.authorization = `Bearer ${wrongSecretToken}`

      await authenticate(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid token'
        })
      )

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockReq.user).toBeUndefined()
    })

    it('should work with token without Bearer prefix (legacy support)', async () => {
      const testUser = await testUtils.createTestUser({
        email: 'legacy@test.com'
      })

      const token = jwt.sign(
        { userId: testUser._id.toString() },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      )

      // Set token directly without Bearer prefix
      mockReq.headers!.authorization = token

      await authenticate(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.user).toEqual(
        expect.objectContaining({
          id: testUser._id.toString(),
          email: 'legacy@test.com'
        })
      )

      expect(mockNext).toHaveBeenCalled()
      expect(mockRes.status).not.toHaveBeenCalled()
    })

    it('should handle case-insensitive Bearer prefix', async () => {
      const testUser = await testUtils.createTestUser({
        email: 'bearer@test.com'
      })

      const token = jwt.sign(
        { userId: testUser._id.toString() },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      )

      // Test with lowercase 'bearer'
      mockReq.headers!.authorization = `bearer ${token}`

      await authenticate(mockReq as Request, mockRes as Response, mockNext)

      expect(mockReq.user).toEqual(
        expect.objectContaining({
          id: testUser._id.toString(),
          email: 'bearer@test.com'
        })
      )

      expect(mockNext).toHaveBeenCalled()
      expect(mockRes.status).not.toHaveBeenCalled()
    })

    it('should not expose sensitive user data in request.user', async () => {
      const testUser = await testUtils.createTestUser({
        email: 'sensitive@test.com'
      })

      const token = jwt.sign(
        { userId: testUser._id.toString() },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      )

      mockReq.headers!.authorization = `Bearer ${token}`

      await authenticate(mockReq as Request, mockRes as Response, mockNext)

      // Verify sensitive data is not exposed
      expect(mockReq.user).not.toHaveProperty('password')
      expect(mockReq.user).not.toHaveProperty('emailVerificationToken')
      expect(mockReq.user).not.toHaveProperty('resetPasswordToken')

      // Verify safe data is exposed
      expect(mockReq.user).toHaveProperty('id')
      expect(mockReq.user).toHaveProperty('email')
      expect(mockReq.user).toHaveProperty('firstName')
      expect(mockReq.user).toHaveProperty('lastName')
    })

    it('should handle database connection errors gracefully', async () => {
      const testUser = await testUtils.createTestUser()
      const token = jwt.sign(
        { userId: testUser._id.toString() },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      )

      mockReq.headers!.authorization = `Bearer ${token}`

      // Mock database error
      const originalFindById = User.findById
      User.findById = vi.fn().mockRejectedValue(new Error('Database connection failed'))

      await authenticate(mockReq as Request, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid token'
        })
      )

      expect(mockNext).not.toHaveBeenCalled()

      // Restore original method
      User.findById = originalFindById
    })
  })
})