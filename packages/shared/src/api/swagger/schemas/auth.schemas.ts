import type { OpenAPIV3 } from 'openapi-types';

/**
 * Authentication-related OpenAPI schemas
 */

export const authSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  // Login Request
  LoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address',
        example: 'user@example.com',
      },
      password: {
        type: 'string',
        format: 'password',
        minLength: 8,
        description: 'User password',
        example: 'SecurePassword123!',
      },
    },
  },

  // Register Request
  RegisterRequest: {
    type: 'object',
    required: ['email', 'password', 'name'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address',
        example: 'newuser@example.com',
      },
      password: {
        type: 'string',
        format: 'password',
        minLength: 8,
        description: 'User password (min 8 characters)',
        example: 'SecurePassword123!',
      },
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'User full name',
        example: 'John Doe',
      },
      organizationName: {
        type: 'string',
        description: 'Optional organization name for new org creation',
        example: 'Acme Corp',
      },
    },
  },

  // Auth Response
  AuthResponse: {
    type: 'object',
    required: ['accessToken', 'refreshToken', 'user'],
    properties: {
      accessToken: {
        type: 'string',
        description: 'JWT access token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
      refreshToken: {
        type: 'string',
        description: 'JWT refresh token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
      tokenType: {
        type: 'string',
        description: 'Token type',
        example: 'Bearer',
        default: 'Bearer',
      },
      expiresIn: {
        type: 'number',
        description: 'Token expiration time in seconds',
        example: 3600,
      },
      user: {
        $ref: '#/components/schemas/User',
      },
    },
  },

  // Refresh Token Request
  RefreshTokenRequest: {
    type: 'object',
    required: ['refreshToken'],
    properties: {
      refreshToken: {
        type: 'string',
        description: 'JWT refresh token',
      },
    },
  },

  // Change Password Request
  ChangePasswordRequest: {
    type: 'object',
    required: ['currentPassword', 'newPassword'],
    properties: {
      currentPassword: {
        type: 'string',
        format: 'password',
        description: 'Current password',
      },
      newPassword: {
        type: 'string',
        format: 'password',
        minLength: 8,
        description: 'New password (min 8 characters)',
      },
    },
  },

  // Forgot Password Request
  ForgotPasswordRequest: {
    type: 'object',
    required: ['email'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address',
      },
    },
  },

  // Reset Password Request
  ResetPasswordRequest: {
    type: 'object',
    required: ['token', 'newPassword'],
    properties: {
      token: {
        type: 'string',
        description: 'Password reset token from email',
      },
      newPassword: {
        type: 'string',
        format: 'password',
        minLength: 8,
        description: 'New password',
      },
    },
  },

  // User Schema
  User: {
    type: 'object',
    required: ['id', 'email', 'name', 'role', 'createdAt'],
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Unique user identifier',
        example: '850e8400-e29b-41d4-a716-446655440000',
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address',
        example: 'user@example.com',
      },
      name: {
        type: 'string',
        description: 'User full name',
        example: 'John Doe',
      },
      role: {
        type: 'string',
        enum: ['owner', 'admin', 'member', 'viewer'],
        description: 'User role',
        example: 'member',
      },
      avatar: {
        type: 'string',
        format: 'uri',
        description: 'Avatar URL',
      },
      isActive: {
        type: 'boolean',
        description: 'Whether user account is active',
        example: true,
      },
      lastLoginAt: {
        type: 'string',
        format: 'date-time',
        description: 'Last login timestamp',
      },
      organizationId: {
        type: 'string',
        format: 'uuid',
        description: 'Current organization ID',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Account creation timestamp',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Last update timestamp',
      },
    },
  },

  // Update Profile Request
  UpdateProfileRequest: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
      },
      avatar: {
        type: 'string',
        format: 'uri',
      },
    },
  },
};
