import { type IUser, User } from '../../../models/User.js';
import type { RegisterUserData, UpdateProfileData } from '../services/AuthService.js';

export class UserRepository {
  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email, isActive: true });
  }

  /**
   * Find user by email with password included
   */
  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return User.findOne({ email, isActive: true }).select('+password +refreshTokens');
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  /**
   * Find user by ID with password included
   */
  async findByIdWithPassword(id: string): Promise<IUser | null> {
    return User.findById(id).select('+password +refreshTokens');
  }

  /**
   * Create a new user
   */
  async create(userData: RegisterUserData): Promise<IUser> {
    const user = new User(userData);
    return user.save();
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { lastLogin: new Date() });
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateData: UpdateProfileData): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update fields if provided
    if (updateData.firstName) user.firstName = updateData.firstName;
    if (updateData.lastName) user.lastName = updateData.lastName;
    if (updateData.email) user.email = updateData.email;

    return user.save();
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.password = newPassword;
    await user.save();
  }

  /**
   * Find user by SSO provider and ID
   */
  async findBySSOId(provider: string, ssoId: string): Promise<IUser | null> {
    return User.findOne({ ssoProvider: provider, ssoId, isActive: true });
  }

  /**
   * Find user by email verification token
   */
  async findByEmailVerificationToken(token: string): Promise<IUser | null> {
    return User.findOne({
      emailVerificationToken: token,
      isActive: true,
    }).select('+emailVerificationToken +emailVerificationTokenExpires');
  }

  /**
   * Find user by password reset token
   */
  async findByPasswordResetToken(token: string): Promise<IUser | null> {
    return User.findOne({
      passwordResetToken: token,
      isActive: true,
    }).select('+passwordResetToken +passwordResetTokenExpires');
  }

  /**
   * Update user permissions
   */
  async updatePermissions(userId: string, permissions: string[]): Promise<void> {
    await User.findByIdAndUpdate(userId, { permissions });
  }
}
