export interface PasswordPolicy {
  minLength?: number;
  maxLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  minUniqueChars?: number;
  preventCommonPasswords?: boolean;
  preventUserInfo?: boolean;
  preventRepeatingChars?: number;
  preventSequentialChars?: number;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'strong' | 'very-strong';
  score: number;
}

export class PasswordValidator {
  private policy: Required<PasswordPolicy>;
  private commonPasswords: Set<string>;

  constructor(policy: PasswordPolicy = {}) {
    this.policy = {
      minLength: policy.minLength ?? 8,
      maxLength: policy.maxLength ?? 128,
      requireUppercase: policy.requireUppercase ?? true,
      requireLowercase: policy.requireLowercase ?? true,
      requireNumbers: policy.requireNumbers ?? true,
      requireSpecialChars: policy.requireSpecialChars ?? true,
      minUniqueChars: policy.minUniqueChars ?? 5,
      preventCommonPasswords: policy.preventCommonPasswords ?? true,
      preventUserInfo: policy.preventUserInfo ?? true,
      preventRepeatingChars: policy.preventRepeatingChars ?? 3,
      preventSequentialChars: policy.preventSequentialChars ?? 3,
    };

    this.commonPasswords = new Set([
      'password',
      '123456',
      '12345678',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'letmein',
      'welcome',
      'monkey',
      '1234567890',
      'password1',
      '123456789',
      'welcome123',
      'root',
      'toor',
      'pass',
      'test',
      'guest',
      'master',
    ]);
  }

  validate(
    password: string,
    userInfo?: { email?: string; username?: string; firstName?: string; lastName?: string }
  ): PasswordValidationResult {
    const errors: string[] = [];
    let score = 0;

    // Length checks
    if (password.length < this.policy.minLength) {
      errors.push(`Password must be at least ${this.policy.minLength} characters long`);
    } else {
      score += 10;
    }

    if (password.length > this.policy.maxLength) {
      errors.push(`Password must not exceed ${this.policy.maxLength} characters`);
    }

    // Character type checks
    if (this.policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else if (this.policy.requireUppercase) {
      score += 10;
    }

    if (this.policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else if (this.policy.requireLowercase) {
      score += 10;
    }

    if (this.policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else if (this.policy.requireNumbers) {
      score += 10;
    }

    if (this.policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else if (this.policy.requireSpecialChars) {
      score += 10;
    }

    // Unique characters check
    const uniqueChars = new Set(password).size;
    if (uniqueChars < this.policy.minUniqueChars) {
      errors.push(`Password must contain at least ${this.policy.minUniqueChars} unique characters`);
    } else {
      score += 10;
    }

    // Common passwords check
    if (this.policy.preventCommonPasswords && this.commonPasswords.has(password.toLowerCase())) {
      errors.push('Password is too common. Please choose a more unique password');
    } else if (this.policy.preventCommonPasswords) {
      score += 10;
    }

    // User info check
    if (this.policy.preventUserInfo && userInfo) {
      const lowerPassword = password.toLowerCase();
      const checks = [
        userInfo.email?.split('@')[0],
        userInfo.username,
        userInfo.firstName,
        userInfo.lastName,
      ].filter(Boolean);

      for (const info of checks) {
        if (info && lowerPassword.includes(info.toLowerCase())) {
          errors.push('Password must not contain personal information');
          break;
        }
      }
      if (!errors.includes('Password must not contain personal information')) {
        score += 10;
      }
    }

    // Repeating characters check
    if (this.policy.preventRepeatingChars) {
      const repeatRegex = new RegExp(`(.)\\1{${this.policy.preventRepeatingChars - 1},}`);
      if (repeatRegex.test(password)) {
        errors.push(
          `Password must not contain ${this.policy.preventRepeatingChars} or more repeating characters`
        );
      } else {
        score += 10;
      }
    }

    // Sequential characters check
    if (this.policy.preventSequentialChars) {
      if (this.hasSequentialChars(password, this.policy.preventSequentialChars)) {
        errors.push(
          `Password must not contain ${this.policy.preventSequentialChars} or more sequential characters`
        );
      } else {
        score += 10;
      }
    }

    // Extra points for length
    score += Math.min((password.length - this.policy.minLength) * 2, 20);

    // Calculate strength
    let strength: 'weak' | 'fair' | 'strong' | 'very-strong';
    if (score < 30) {
      strength = 'weak';
    } else if (score < 60) {
      strength = 'fair';
    } else if (score < 80) {
      strength = 'strong';
    } else {
      strength = 'very-strong';
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength,
      score: Math.min(score, 100),
    };
  }

  private hasSequentialChars(password: string, maxSequential: number): boolean {
    const sequences = [
      'abcdefghijklmnopqrstuvwxyz',
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      '0123456789',
      'qwertyuiop',
      'asdfghjkl',
      'zxcvbnm',
    ];

    const lowerPassword = password.toLowerCase();

    for (const seq of sequences) {
      for (let i = 0; i <= seq.length - maxSequential; i++) {
        const subSeq = seq.slice(i, i + maxSequential);
        const reverseSubSeq = subSeq.split('').reverse().join('');
        if (lowerPassword.includes(subSeq) || lowerPassword.includes(reverseSubSeq)) {
          return true;
        }
      }
    }

    return false;
  }

  generateStrongPassword(length = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const allChars = uppercase + lowercase + numbers + special;
    let password = '';

    // Ensure at least one of each required type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }
}
