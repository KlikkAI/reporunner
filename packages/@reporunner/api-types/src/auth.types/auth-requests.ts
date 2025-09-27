import { z } from 'zod';
import { UserRole, PermissionType } from './auth-enums';

export interface IUser {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  role: UserRole;
  permissions: PermissionType[];
  organizationId: string;
  teamIds?: string[];
  isActive: boolean;
  isEmailVerified: boolean;
  mfaEnabled: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  settings?: {
    timezone?: string;
    locale?: string;
    theme?: 'light' | 'dark' | 'system';
    notifications?: {
      email: boolean;
      inApp: boolean;
      workflowErrors: boolean;
      workflowSuccess: boolean;
      systemUpdates: boolean;
    };
    editorPreferences?: {
      minimap: boolean;
      gridSnap: boolean;
      autoSave: boolean;
      autoSaveInterval?: number;
    };
  };
  metadata?: Record<string, any>;
}

export interface ILoginRequest {
  email: string;
  password: string;
  mfaCode?: string;
  rememberMe?: boolean;
}

export interface ILoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: IUser;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  inviteCode?: string;
}

export interface IPasswordResetRequest {
  email: string;
}

export interface IPasswordResetConfirm {
  token: string;
  newPassword: string;
}

// Zod Schemas
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  displayName: z.string().optional(),
  avatar: z.string().url().optional(),
  role: z.nativeEnum(UserRole),
  permissions: z.array(z.nativeEnum(PermissionType)),
  organizationId: z.string(),
  teamIds: z.array(z.string()).optional(),
  isActive: z.boolean(),
  isEmailVerified: z.boolean(),
  mfaEnabled: z.boolean(),
  lastLogin: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  settings: z
    .object({
      timezone: z.string().optional(),
      locale: z.string().optional(),
      theme: z.enum(['light', 'dark', 'system']).optional(),
      notifications: z
        .object({
          email: z.boolean(),
          inApp: z.boolean(),
          workflowErrors: z.boolean(),
          workflowSuccess: z.boolean(),
          systemUpdates: z.boolean(),
        })
        .optional(),
      editorPreferences: z
        .object({
          minimap: z.boolean(),
          gridSnap: z.boolean(),
          autoSave: z.boolean(),
          autoSaveInterval: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  mfaCode: z.string().optional(),
  rememberMe: z.boolean().optional(),
});

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  organizationName: z.string().optional(),
  inviteCode: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
