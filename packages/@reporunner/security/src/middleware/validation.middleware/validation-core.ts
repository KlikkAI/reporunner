import { ERROR_CODES } from '@reporunner/constants';
import type { NextFunction, Request, Response } from 'express';
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

export interface ValidationRule {
  field: string;
  location?: 'body' | 'query' | 'params' | 'headers';
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'uuid' | 'json' | 'array' | 'object';
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean | string;
  sanitize?: boolean;
  trim?: boolean;
  escape?: boolean;
  normalizeEmail?: boolean;
  toLowerCase?: boolean;
  toUpperCase?: boolean;
  default?: any;
  transform?: (value: any) => any;
}

export interface ValidationSchema {
  rules: ValidationRule[];
  allowUnknown?: boolean;
  stripUnknown?: boolean;
  abortEarly?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  location?: string;
}

/**
 * SQL injection patterns to detect
 */
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER|EXEC|EXECUTE|SCRIPT|JAVASCRIPT|ALERT|CONFIRM|PROMPT)\b)/gi,
  /(--|#|\/\*|\*\/|;|\||\\x[0-9a-f]{2}|\\u[0-9a-f]{4})/gi,
  /('|(')|"|(")|(--)|(\|)|(\|\|)|(;))/gi,
  /(UNION\s+SELECT|SELECT\s+\*|DROP\s+TABLE|INSERT\s+INTO)/gi,
];

/**
 * NoSQL injection patterns to detect
 */
const NOSQL_INJECTION_PATTERNS = [
  /(\$where|\$regex|\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin|\$exists|\$type)/gi,
  /({|}|\[|\])/g,
  /(\$\w+)/g,
];

/**
 * XSS patterns to detect
 */
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<img[^>]*onerror\s*=/gi,
  /<svg[^>]*onload\s*=/gi,
];

/**
 * Path traversal patterns to detect
 */
const PATH_TRAVERSAL_PATTERNS = [/\.\.\//g, /\.\.\\/, /%2e%2e%2f/gi, /%252e%252e%252f/gi, /\.\./g];

/**
 * Command injection patterns to detect
 */
const COMMAND_INJECTION_PATTERNS = [/[;&|`$()]/g, /\$\(/g, /`[^`]*`/g, /\|\|/g, /&&/g];

/**
 * Create validation middleware
 */
export function createValidationMiddleware(schema: ValidationSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors: ValidationError[] = [];
    const validatedData: any = {};

    // Process each rule
    for (const rule of schema.rules) {
      const location = rule.location || 'body';
      const source = req[location as keyof Request] as any;
      const value = source?.[rule.field];

      // Check required fields
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field: rule.field,
