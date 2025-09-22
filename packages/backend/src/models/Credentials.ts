import crypto from 'crypto';
import dotenv from 'dotenv';
import mongoose, { type Document, Schema } from 'mongoose';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// Ensure environment variables are loaded
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(
  'Before dotenv.config() - CREDENTIAL_ENCRYPTION_KEY:',
  process.env.CREDENTIAL_ENCRYPTION_KEY
);
const envPath = path.resolve(__dirname, '../../.env');
console.log('Resolved .env path:', envPath);
dotenv.config({ path: envPath });
console.log(
  'After dotenv.config() - CREDENTIAL_ENCRYPTION_KEY:',
  process.env.CREDENTIAL_ENCRYPTION_KEY
);

export interface ICredential extends Document {
  _id: string;
  name: string;
  type:
    | 'oauth2'
    | 'api_key'
    | 'basic_auth'
    | 'bearer_token'
    | 'custom'
    | 'openaiApi'
    | 'anthropicApi'
    | 'googleAiApi'
    | 'azureOpenAiApi'
    | 'awsBedrockApi';
  userId: string;
  integration: string;
  data: Record<string, any>;
  isActive: boolean;
  isValid?: boolean;
  expiresAt?: Date;
  lastUsed?: Date;
  lastTestedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  encrypt(data: Record<string, any>): Record<string, any>;
  decrypt(encryptedData: Record<string, any>): Record<string, any>;
  getDecryptedData(): Record<string, any>;
  markAsUsed(): Promise<ICredential>;
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
      enum: [
        'oauth2',
        'api_key',
        'basic_auth',
        'bearer_token',
        'custom',
        'openaiApi',
        'anthropicApi',
        'googleAiApi',
        'azureOpenAiApi',
        'awsBedrockApi',
      ],
      required: [true, 'Credential type is required'],
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      ref: 'User',
    },
    integration: {
      type: String,
      required: [true, 'Integration name is required'],
      trim: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
      select: false, // Don't include credential data in queries by default
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isValid: {
      type: Boolean,
    },
    expiresAt: {
      type: Date,
    },
    lastUsed: {
      type: Date,
    },
    lastTestedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
credentialSchema.index({ userId: 1, integration: 1 });
credentialSchema.index({ userId: 1, isActive: 1 });
credentialSchema.index({ expiresAt: 1 });

// Virtual for expiry status
credentialSchema.virtual('isExpired').get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Encryption key from environment
const getEncryptionKey = (): Buffer => {
  const keyHex = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('CREDENTIAL_ENCRYPTION_KEY environment variable is required');
  }
  if (keyHex.length !== 64) {
    throw new Error('CREDENTIAL_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)');
  }
  try {
    return Buffer.from(keyHex, 'hex');
  } catch (error) {
    throw new Error('CREDENTIAL_ENCRYPTION_KEY must be a valid hex string');
  }
};

const ENCRYPTION_KEY = getEncryptionKey();

// Debug: Log if we're using env key or random key
console.log('📄 Credentials model loading...');
console.log('   CREDENTIAL_ENCRYPTION_KEY available:', !!process.env.CREDENTIAL_ENCRYPTION_KEY);
if (process.env.CREDENTIAL_ENCRYPTION_KEY) {
  console.log('✓ Using CREDENTIAL_ENCRYPTION_KEY from environment');
} else {
  console.log(
    '⚠️  WARNING: CREDENTIAL_ENCRYPTION_KEY not set, using random key - credentials will be lost on restart!'
  );
}

const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

// Method to encrypt credential data
credentialSchema.methods.encrypt = (data: Record<string, any>): Record<string, any> => {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
    };
  } catch (error: any) {
    console.error('Encryption error:', error);
    throw new Error(`Failed to encrypt credential data: ${error.message}`);
  }
};

// Method to decrypt credential data
credentialSchema.methods.decrypt = (encryptedData: Record<string, any>): Record<string, any> => {
  if (!encryptedData || typeof encryptedData !== 'object') {
    throw new Error('Invalid encrypted data format');
  }

  try {
    // Check if data has proper IV format
    if (encryptedData.iv && encryptedData.encrypted) {
      const iv = Buffer.from(encryptedData.iv, 'hex');
      if (iv.length !== IV_LENGTH) {
        throw new Error('Invalid IV length');
      }

      const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      const parsedData = JSON.parse(decrypted);
      return parsedData;
    } else {
      throw new Error('Missing encryption IV. This credential needs to be re-created.');
    }
  } catch (error: any) {
    console.error('Failed to decrypt credential data:', error);

    // Provide more specific error message
    if (error.code === 'ERR_OSSL_BAD_DECRYPT') {
      throw new Error(
        'Failed to decrypt credential data. The credential may be corrupted or using an outdated encryption method.'
      );
    } else if (error.message.includes('JSON')) {
      throw new Error(
        'Failed to parse decrypted credential data. The credential may be corrupted.'
      );
    } else {
      throw new Error(`Failed to decrypt credential data: ${error.message}`);
    }
  }
};

// Pre-save middleware to encrypt data
credentialSchema.pre('save', async function (next) {
  if (this.isModified('data') && this.data) {
    // Check if data is already encrypted (has iv and encrypted properties)
    if (typeof this.data === 'object' && this.data.iv && this.data.encrypted) {
      // Data is already encrypted, don't encrypt again
      return next();
    }

    // Encrypt the data
    this.data = this.encrypt(this.data);
  }
  next();
});

// Method to get decrypted data
credentialSchema.methods.getDecryptedData = function (): Record<string, any> {
  if (!this.data) return {};
  return this.decrypt(this.data);
};

// Static method to find active credentials
credentialSchema.statics.findActive = function (userId: string, integration?: string) {
  const query: any = { userId, isActive: true };
  if (integration) {
    query.integration = integration;
  }

  // Check for expired credentials
  query.$or = [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }];

  return this.find(query);
};

// Method to refresh OAuth2 credentials
credentialSchema.methods.refreshOAuth2Token = async function (refreshToken: string) {
  if (this.type !== 'oauth2') {
    throw new Error('This method is only available for OAuth2 credentials');
  }

  // This would typically make an API call to refresh the token
  // Implementation depends on the specific OAuth2 provider

  this.lastUsed = new Date();
  return this.save();
};

// Method to mark as used
credentialSchema.methods.markAsUsed = function () {
  this.lastUsed = new Date();
  return this.save();
};

// Remove credential data from JSON output
credentialSchema.methods.toJSON = function () {
  const credentialObject = this.toObject();
  delete credentialObject.data;
  return credentialObject;
};

export const Credential = mongoose.model<ICredential>('Credential', credentialSchema);
