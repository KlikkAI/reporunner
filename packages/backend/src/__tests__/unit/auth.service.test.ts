import { describe, it, expect, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { AuthService } from '../../domains/auth/services/AuthService.js'
import { User } from '../../models/User.js'
import { testUtils } from '../setup.js'

describe('AuthService', () => {
  let authService: AuthService

  beforeEach(() => {
    authService = new AuthService()
  })

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // Create test user with known password
      const plainPassword = 'Password123'
      const testUser = await testUtils.createTestUser({
        email: 'service@test.com',
        password: plainPassword,  // Let User model handle hashing
        isActive: true
      })

      const result = await authService.login('service@test.com', plainPassword)

      expect(result).toMatchObject({
        user: {
          id: testUser._id.toString(),
          email: 'service@test.com',
          firstName: 'Test',
          lastName: 'User',
          fullName: 'Test User',
          role: 'user'
        },
        token: expect.any(String),
        refreshToken: expect.any(String)
      })
      
      // Verify lastLogin is a valid date
      expect(result.user.lastLogin).toBeInstanceOf(Date)

      // Verify JWT token is valid
      const decodedToken = jwt.verify(
        result.token, 
        process.env.JWT_SECRET || 'test-secret'
      ) as any
      expect(decodedToken.userId).toBe(testUser._id.toString())
    })

    it('should throw error for non-existent user', async () => {
      await expect(
        authService.login('nonexistent@test.com', 'password123')
      ).rejects.toThrow('Invalid email or password')
    })

    it('should throw error for incorrect password', async () => {
      const testUser = await testUtils.createTestUser({
        email: 'service@test.com',
        password: await bcrypt.hash('password123', 10)
      })

      await expect(
        authService.login('service@test.com', 'wrongpassword')
      ).rejects.toThrow('Invalid email or password')
    })

    it('should throw error for inactive user', async () => {
      const testUser = await testUtils.createTestUser({
        email: 'inactive@test.com',
        password: await bcrypt.hash('password123', 10),
        isActive: false
      })

      await expect(
        authService.login('inactive@test.com', 'password123')
      ).rejects.toThrow('Invalid email or password')
    })
  })

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const userData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@test.com',
        password: 'password123'
      }

      const result = await authService.register(userData)

      expect(result).toEqual(
        expect.objectContaining({
          user: expect.objectContaining({
            email: 'jane.smith@test.com',
            firstName: 'Jane',
            lastName: 'Smith',
            fullName: 'Jane Smith',
            role: 'user'
          }),
          token: expect.any(String),
          refreshToken: expect.any(String)
        })
      )

      // Verify user exists in database
      const createdUser = await User.findOne({ email: 'jane.smith@test.com' }).select('+password')
      expect(createdUser).toBeTruthy()
      expect(createdUser?.firstName).toBe('Jane')
      expect(createdUser?.lastName).toBe('Smith')
      
      // Verify password is hashed
      expect(createdUser?.password).not.toBe('password123')
      const passwordValid = await bcrypt.compare('password123', createdUser?.password || '')
      expect(passwordValid).toBe(true)
    })

    it('should throw error for existing email', async () => {
      // Create existing user
      await testUtils.createTestUser({ email: 'existing@test.com' })

      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@test.com',
        password: 'password123'
      }

      await expect(authService.register(userData)).rejects.toThrow(
        'User already exists with this email'
      )
    })

    it('should hash the password during registration', async () => {
      const userData = {
        firstName: 'Hash',
        lastName: 'Test',
        email: 'hash@test.com',
        password: 'plainpassword'
      }

      await authService.register(userData)

      const createdUser = await User.findOne({ email: 'hash@test.com' }).select('+password')
      expect(createdUser?.password).not.toBe('plainpassword')
      expect(createdUser?.password).toMatch(/^\$2[aby]\$1[0-2]\$/) // bcrypt hash format
    })
  })

  describe('getUserProfile', () => {
    it('should return user profile for valid ID', async () => {
      const testUser = await testUtils.createTestUser({
        email: 'getuser@test.com'
      })

      const result = await authService.getUserProfile(testUser._id.toString())

      expect(result).toMatchObject({
        id: testUser._id.toString(),
        email: 'getuser@test.com',
        firstName: 'Test',
        lastName: 'User',
        fullName: 'Test User',
        role: 'user'
      })
    })

    it('should throw error for non-existent user ID', async () => {
      await expect(
        authService.getUserProfile('507f1f77bcf86cd799439011')
      ).rejects.toThrow('User not found')
    })

    it('should throw error for invalid user ID format', async () => {
      await expect(
        authService.getUserProfile('invalid-id')
      ).rejects.toThrow()
    })
  })

  describe('refreshToken', () => {
    it('should successfully refresh token with valid refresh token', async () => {
      const testUser = await testUtils.createTestUser({
        isActive: true
      })
      
      const refreshToken = jwt.sign(
        { userId: testUser._id.toString() },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '7d' }
      )

      const result = await authService.refreshToken(refreshToken)

      expect(result).toEqual(
        expect.objectContaining({
          accessToken: expect.any(String),
          refreshToken: expect.any(String)
        })
      )

      // Verify tokens are present and valid
      expect(result.accessToken).toBeDefined()
      expect(typeof result.accessToken).toBe('string')
      expect(result.refreshToken).toBeDefined()
      expect(typeof result.refreshToken).toBe('string')

      // Verify new access token is valid
      const decodedToken = jwt.verify(
        result.accessToken,
        process.env.JWT_SECRET || 'test-secret'
      ) as any
      expect(decodedToken.userId).toBe(testUser._id.toString())
    })

    it('should throw error for invalid refresh token', async () => {
      await expect(
        authService.refreshToken('invalid-refresh-token')
      ).rejects.toThrow('Invalid refresh token')
    })

    it('should throw error for refresh token with non-existent user', async () => {
      const refreshToken = jwt.sign(
        { userId: '507f1f77bcf86cd799439011' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '7d' }
      )

      await expect(
        authService.refreshToken(refreshToken)
      ).rejects.toThrow('Invalid refresh token')
    })

    it('should throw error for inactive user', async () => {
      const testUser = await testUtils.createTestUser({
        isActive: false
      })
      
      const refreshToken = jwt.sign(
        { userId: testUser._id.toString() },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '7d' }
      )

      await expect(
        authService.refreshToken(refreshToken)
      ).rejects.toThrow('Invalid refresh token')
    })
  })

  describe('updateProfile', () => {
    it('should successfully update user profile', async () => {
      const testUser = await testUtils.createTestUser({
        email: 'update@test.com',
        firstName: 'Original',
        lastName: 'Name'
      })

      const updateData = {
        firstName: 'Updated',
        lastName: 'Profile'
      }

      const result = await authService.updateProfile(testUser._id.toString(), updateData)

      expect(result).toMatchObject({
        id: testUser._id.toString(),
        email: 'update@test.com',
        firstName: 'Updated',
        lastName: 'Profile',
        fullName: 'Updated Profile',
        role: 'user'
      })

      // Verify database is updated
      const updatedUser = await User.findById(testUser._id)
      expect(updatedUser?.firstName).toBe('Updated')
      expect(updatedUser?.lastName).toBe('Profile')
    })

    it('should throw error for non-existent user', async () => {
      const updateData = {
        firstName: 'Test'
      }

      await expect(
        authService.updateProfile('507f1f77bcf86cd799439011', updateData)
      ).rejects.toThrow('User not found')
    })
  })

  describe('changePassword', () => {
    it('should successfully change password with correct current password', async () => {
      const currentPassword = 'CurrentPass123'
      const newPassword = 'NewPass123'
      
      const testUser = await testUtils.createTestUser({
        email: 'changepass@test.com',
        password: currentPassword  // Let User model handle hashing
      })

      await authService.changePassword(testUser._id.toString(), currentPassword, newPassword)

      // Verify password is changed in database
      const updatedUser = await User.findById(testUser._id).select('+password')
      expect(updatedUser).toBeTruthy()
      
      // Use User model's comparePassword method for verification
      const isNewPasswordValid = await updatedUser?.comparePassword(newPassword)
      expect(isNewPasswordValid).toBe(true)
      
      const isOldPasswordInvalid = await updatedUser?.comparePassword(currentPassword)
      expect(isOldPasswordInvalid).toBe(false)
    })

    it('should throw error for incorrect current password', async () => {
      const testUser = await testUtils.createTestUser({
        password: 'CorrectPass123'  // Let User model handle hashing
      })

      await expect(
        authService.changePassword(testUser._id.toString(), 'WrongPass123', 'NewPass123')
      ).rejects.toThrow('Current password is incorrect')
    })

    it('should throw error for non-existent user', async () => {
      await expect(
        authService.changePassword('507f1f77bcf86cd799439011', 'current', 'new')
      ).rejects.toThrow('Current password is incorrect')
    })
  })
})