import jwt, { SignOptions } from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository.js';
import { AppError } from '../../../middleware/errorHandlers.js';

export interface RegisterUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Generate JWT token
   */
  private generateToken(userId: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }
    return jwt.sign({ userId }, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    } as SignOptions);
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(userId: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }
    return jwt.sign({ userId }, secret, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    } as SignOptions);
  }

  /**
   * Register a new user
   */
  async register(userData: RegisterUserData) {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new AppError('User already exists with this email', 409);
    }

    // Create new user
    const user = await this.userRepository.create(userData);

    // Generate tokens
    const token = this.generateToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
      },
      token,
      refreshToken,
    };
  }

  /**
   * Login user
   */
  async login(email: string, password: string) {
    // Find user and include password
    const user = await this.userRepository.findByEmailWithPassword(email);
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid email or password', 401);
    }

    // Update last login
    await this.userRepository.updateLastLogin(user._id);

    // Generate tokens
    const token = this.generateToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        lastLogin: new Date(),
      },
      token,
      refreshToken,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET as string) as any;
      const user = await this.userRepository.findById(decoded.userId);

      if (!user || !user.isActive) {
        throw new AppError('Invalid refresh token', 401);
      }

      const newToken = this.generateToken(user._id);
      const newRefreshToken = this.generateRefreshToken(user._id);

      return {
        accessToken: newToken,
        refreshToken: newRefreshToken,
        tokenType: 'Bearer',
        expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        scope: []
      };
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateData: UpdateProfileData) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const updatedUser = await this.userRepository.updateProfile(userId, updateData);

    return {
      id: updatedUser._id.toString(),
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      fullName: updatedUser.fullName,
      role: updatedUser.role,
    };
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepository.findByIdWithPassword(userId);
    if (!user || !(await user.comparePassword(currentPassword))) {
      throw new AppError('Current password is incorrect', 400);
    }

    await this.userRepository.updatePassword(userId, newPassword);
  }
}