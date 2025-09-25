/**
 * Organization model for multi-tenant architecture
 */
import mongoose, { type Document, Schema } from 'mongoose';

export interface IOrganization extends Document {
  _id: string;
  name: string;
  slug: string; // URL-friendly name
  description?: string;
  logo?: string;
  website?: string;
  industry?: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  plan: 'free' | 'pro' | 'business' | 'enterprise';
  settings: {
    allowUserRegistration: boolean;
    enforceEmailVerification: boolean;
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
      expirationDays?: number;
    };
    sessionTimeout: number; // in minutes
    ssoEnabled: boolean;
    ssoProvider?: string;
    ssoSettings?: Record<string, any>;
    auditLogRetention: number; // in days
    maxUsers?: number;
    maxWorkflows?: number;
    features: string[]; // enabled features
  };
  billing: {
    customerId?: string; // Stripe customer ID
    subscriptionId?: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    status: 'active' | 'inactive' | 'suspended' | 'cancelled';
  };
  isActive: boolean;
  ownerId: string; // User ID of organization owner
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: [100, 'Organization name cannot be more than 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Organization slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    logo: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
    },
    size: {
      type: String,
      enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
      default: 'small',
    },
    plan: {
      type: String,
      enum: ['free', 'pro', 'business', 'enterprise'],
      default: 'free',
    },
    settings: {
      allowUserRegistration: {
        type: Boolean,
        default: true,
      },
      enforceEmailVerification: {
        type: Boolean,
        default: false,
      },
