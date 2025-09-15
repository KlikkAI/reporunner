import { User, IUser } from '../../../models/User.js';
import { UpdateProfileData } from '../services/AuthService.js';

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
    return User.findOne({ email, isActive: true }).select('+password');
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
    return User.findById(id).select('+password');
  }

  /**
   * Create a new user
   */
  async create(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<IUser> {
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
}