import { z } from 'zod';
import { ApiResponseSchema, IdSchema, MetadataSchema, TimestampSchema } from './BaseSchemas';

// User schemas (aligned with backend roles)
export const UserRoleSchema = z.enum(['super_admin', 'admin', 'member', 'viewer']);

export const UserProfileSchema = z.object({
  id: IdSchema,
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: UserRoleSchema,
  // Optional fields that might not always be provided by backend
  fullName: z.string().optional(),
  lastLogin: z.string().optional(), // Backend uses lastLogin instead of lastLoginAt
  avatar: z.string().url().optional(),
  timezone: z.string().optional(),
  preferences: z
    .object({
      theme: z.enum(['light', 'dark', 'system']).default('system'),
      language: z.string().default('en'),
      notifications: z
        .object({
          email: z.boolean().default(true),
          workflow: z.boolean().default(true),
          system: z.boolean().default(true),
        })
        .default({
          email: true,
          workflow: true,
          system: true,
        }),
    })
    .default({
      theme: 'system',
      language: 'en',
      notifications: {
        email: true,
        workflow: true,
        system: true,
      },
    })
    .optional(),
  createdAt: TimestampSchema.optional(),
  updatedAt: TimestampSchema.optional(),
  lastLoginAt: TimestampSchema.optional(),
  isActive: z.boolean().default(true).optional(),
  isEmailVerified: z.boolean().default(false).optional(),
});

// Authentication schemas
export const LoginCredentialsSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().default(false),
});

export const RegisterRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, 'You must accept the terms and conditions'),
});

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenType: z.string().default('Bearer'),
  expiresIn: z.number().int().min(0), // seconds
  expiresAt: TimestampSchema,
  scope: z.array(z.string()).default([]),
});

export const LoginResponseSchema = z.object({
  user: UserProfileSchema,
  token: z.string(),
  refreshToken: z.string(),
  // Optional fields that backend may not always provide
  permissions: z.array(z.string()).default([]).optional(),
  sessionId: z.string().optional(),
});

// Password reset schemas
export const PasswordResetRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const PasswordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  email: z.string().email('Please enter a valid email address'),
  newPassword: z
