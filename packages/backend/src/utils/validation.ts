/**
 * Common validation utilities
 */

import mongoose from 'mongoose';

export class ValidationUtils {
  /**
   * Check if string is a valid MongoDB ObjectId
   */
  static isValidObjectId(id: string): boolean {
    return mongoose.Types.ObjectId.isValid(id);
  }

  /**
   * Check if email format is valid
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if password meets complexity requirements
   */
  static isValidPassword(password: string): boolean {
    // At least 8 characters, one uppercase, one lowercase, one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  /**
   * Validate pagination parameters
   */
  static validatePagination(page?: string | number, limit?: string | number) {
    const pageNum = typeof page === 'string' ? Number.parseInt(page, 10) : page || 1;
    const limitNum = typeof limit === 'string' ? Number.parseInt(limit, 10) : limit || 20;

    return {
      page: Math.max(1, pageNum),
      limit: Math.min(100, Math.max(1, limitNum)),
      skip: (Math.max(1, pageNum) - 1) * Math.min(100, Math.max(1, limitNum)),
    };
  }

  /**
   * Sanitize string for safe database operations
   */
  static sanitizeString(str: string): string {
    return str.trim().replace(/[<>]/g, '');
  }

  /**
   * Check if URL is valid
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate JSON string
   */
  static isValidJson(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }
}
