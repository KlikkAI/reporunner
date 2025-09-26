/**
 * Example: Optimized User Repository using shared base classes
 *
 * BEFORE: Custom repository with 100+ lines of duplicate CRUD operations
 * AFTER: Extends BaseRepository, adds only domain-specific methods
 */
import { BaseRepository } from '@reporunner/shared';
import { User } from '../interfaces/User';

export class UserRepository extends BaseRepository<User> {
  // Only domain-specific methods, CRUD is inherited

  async findByEmail(email: string): Promise<User | null> {
    return this.model.findOne({ email }).exec();
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.model.findOne({ email }).select('+password').exec();
  }

  async findBySSOId(ssoId: string): Promise<User | null> {
    return this.model.findOne({ ssoId }).exec();
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.model.findByIdAndUpdate(userId, {
      lastLogin: new Date()
    }).exec();
  }

  async incrementLoginAttempts(userId: string): Promise<void> {
    await this.model.findByIdAndUpdate(userId, {
      $inc: { loginAttempts: 1 }
    }).exec();
  }

  async resetLoginAttempts(userId: string): Promise<void> {
    await this.model.findByIdAndUpdate(userId, {
      loginAttempts: 0
    }).exec();
  }
}

// REDUCTION: ~150 lines → ~40 lines (73% reduction)