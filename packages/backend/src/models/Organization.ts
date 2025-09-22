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
      passwordPolicy: {
        minLength: {
          type: Number,
          default: 8,
          min: 6,
          max: 32,
        },
        requireUppercase: {
          type: Boolean,
          default: false,
        },
        requireLowercase: {
          type: Boolean,
          default: false,
        },
        requireNumbers: {
          type: Boolean,
          default: false,
        },
        requireSpecialChars: {
          type: Boolean,
          default: false,
        },
        expirationDays: {
          type: Number,
          min: 30,
          max: 365,
        },
      },
      sessionTimeout: {
        type: Number,
        default: 480, // 8 hours in minutes
        min: 15,
        max: 1440, // 24 hours
      },
      ssoEnabled: {
        type: Boolean,
        default: false,
      },
      ssoProvider: {
        type: String,
        enum: ['google', 'microsoft', 'okta', 'auth0'],
      },
      ssoSettings: {
        type: Schema.Types.Mixed,
      },
      auditLogRetention: {
        type: Number,
        default: 90, // 90 days
        min: 30,
        max: 365,
      },
      maxUsers: {
        type: Number,
        min: 1,
      },
      maxWorkflows: {
        type: Number,
        min: 1,
      },
      features: {
        type: [String],
        default: ['workflows', 'integrations', 'basic_auth'],
      },
    },
    billing: {
      customerId: {
        type: String,
      },
      subscriptionId: {
        type: String,
      },
      currentPeriodStart: {
        type: Date,
      },
      currentPeriodEnd: {
        type: Date,
      },
      status: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'cancelled'],
        default: 'active',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    ownerId: {
      type: String,
      ref: 'User',
      required: [true, 'Organization owner is required'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
organizationSchema.index({ slug: 1 }, { unique: true });
organizationSchema.index({ isActive: 1 });
organizationSchema.index({ ownerId: 1 });
organizationSchema.index({ 'billing.status': 1 });
organizationSchema.index({ plan: 1 });

// Virtual for user count (would need to be populated separately)
organizationSchema.virtual('userCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'organizationId',
  count: true,
});

// Method to check if organization has a specific feature
organizationSchema.methods.hasFeature = function (feature: string): boolean {
  return this.settings.features.includes(feature);
};

// Method to check if organization can add more users
organizationSchema.methods.canAddUsers = function (currentUserCount: number): boolean {
  if (!this.settings.maxUsers) return true;
  return currentUserCount < this.settings.maxUsers;
};

// Method to check if organization can add more workflows
organizationSchema.methods.canAddWorkflows = function (currentWorkflowCount: number): boolean {
  if (!this.settings.maxWorkflows) return true;
  return currentWorkflowCount < this.settings.maxWorkflows;
};

export const Organization = mongoose.model<IOrganization>('Organization', organizationSchema);
