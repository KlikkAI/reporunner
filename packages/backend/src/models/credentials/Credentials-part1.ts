import crypto from 'node:crypto';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mongoose, { type Document, Schema } from 'mongoose';

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
