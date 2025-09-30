/**
 * Example: Optimized Use Case using shared base classes
 *
 * BEFORE: Individual use-case file with standard CRUD implementation
 * AFTER: Extends BaseGetByIdUseCase, adds validation/authorization
 */

import { BaseGetByIdUseCase, LoggingUtils } from '@reporunner/shared';
import { inject, injectable } from 'inversify';
import type { User } from '../interfaces/User';
import type { UserRepository } from '../repositories/UserRepository';

@injectable()
export class GetUserByIdUseCase extends BaseGetByIdUseCase<User> {
  constructor(@inject('UserRepository') userRepository: UserRepository) {
    super(userRepository);
  }

  async execute(id: string): Promise<User | null> {
    // Add domain-specific validation
    if (!this.isValidObjectId(id)) {
      LoggingUtils.error('Invalid user ID format', { id });
      throw new Error('Invalid user ID format');
    }

    // Call parent implementation
    const user = await super.execute(id);

    // Add domain-specific logic (e.g., permissions check)
    if (user) {
      LoggingUtils.debug('User retrieved successfully', { userId: id });
    }

    return user;
  }

  private isValidObjectId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }
}

// REDUCTION: Eliminates 15+ identical FindById use-cases across domains
