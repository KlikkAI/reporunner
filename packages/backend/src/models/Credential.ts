import mongoose, { type Document, Schema } from 'mongoose';
import type { CredentialType } from '../../../shared/src/types/auth';

export interface ICredential extends Document {
  _id: string;
  name: string;
  type: CredentialType;
  userId: string;
  integration: string;
  data: Record<string, unknown>; // Encrypted credential data
  verified: boolean;
  isValid: boolean;
  isActive: boolean;
  lastUsed?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  markAsUsed(): Promise<Document>;
  isExpired(): boolean;
}

const credentialSchema = new Schema<ICredential>(
  {
    name: {
      type: String,
      required: [true, 'Credential name is required'],
      trim: true,
      maxlength: [100, 'Credential name cannot be more than 100 characters'],
    },
    type: {
      type: String,
      required: [true, 'Credential type is required'],
      enum: [
        'gmailOAuth2',
        'openaiApi',
        'anthropicApi',
        'googleAiApi',
        'azureOpenAiApi',
        'awsBedrockApi',
        'ollamaApi',
        'postgres',
        'mongodb',
        'mysql',
        'redis',
        'slack',
        'discord',
        'webhook',
        'custom',
      ],
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      ref: 'User',
      index: true,
    },
    integration: {
      type: String,
      required: [true, 'Integration name is required'],
      trim: true,
      maxlength: [100, 'Integration name cannot be more than 100 characters'],
    },
    data: {
      type: Schema.Types.Mixed,
      required: [true, 'Credential data is required'],
      select: false, // Don't include sensitive data in queries by default
    },
    verified: {
      type: Boolean,
      default: false,
    },
    isValid: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUsed: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for performance
credentialSchema.index({ userId: 1, isActive: 1 });
credentialSchema.index({ userId: 1, type: 1 });
credentialSchema.index({ userId: 1, integration: 1 });
credentialSchema.index({ expiresAt: 1 });

// Method to mark credential as used
credentialSchema.methods.markAsUsed = function () {
  return this.updateOne({
    $set: { lastUsed: new Date() },
  });
};

// Method to check if credential is expired
credentialSchema.methods.isExpired = function (): boolean {
  if (!this.expiresAt) {
    return false;
  }
  return new Date() > this.expiresAt;
};

// Pre-save middleware to validate expiration
credentialSchema.pre('save', function (next) {
  // If credential has an expiration date and is expired, mark as invalid
  if (this.expiresAt && new Date() > this.expiresAt) {
    this.isValid = false;
  }
  next();
});

// Remove sensitive data from JSON output
credentialSchema.methods.toJSON = function () {
  const credentialObject = this.toObject();
  // Never expose raw credential data in JSON responses
  credentialObject.data = undefined;
  return credentialObject;
};

export const Credential = mongoose.model<ICredential>('Credential', credentialSchema);
