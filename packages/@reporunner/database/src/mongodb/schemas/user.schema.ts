import { type IUser, PermissionType, UserRole } from '@reporunner/api-types';
import bcrypt from 'bcrypt';
import { type Document, model, Schema } from 'mongoose';

// Create a Document interface that extends IUser with password and sensitive fields
interface IUserDocument extends Omit<IUser, 'id'>, Document {
  // Sensitive fields not included in public interface
  password: string;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  mfaSecret?: string;
  mfaBackupCodes?: string[];
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  passwordChangedAt?: Date;
  loginAttempts?: number;
  lockUntil?: Date;
  // Virtual properties
  fullName?: string;
  isLocked?: boolean;
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  changedPasswordAfter(JWTTimestamp: number): boolean;
  incLoginAttempts(): Promise<any>;
  resetLoginAttempts(): Promise<any>;
}

const UserSettingsSchema = new Schema({
  timezone: { type: String, default: 'UTC' },
  locale: { type: String, default: 'en-US' },
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
  notifications: {
    email: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true },
    workflowErrors: { type: Boolean, default: true },
    workflowSuccess: { type: Boolean, default: false },
    systemUpdates: { type: Boolean, default: true },
  },
  editorPreferences: {
    minimap: { type: Boolean, default: true },
    gridSnap: { type: Boolean, default: true },
    autoSave: { type: Boolean, default: true },
    autoSaveInterval: { type: Number, default: 60 },
  },
});

export const UserSchema = new Schema<IUserDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    username: { type: String, sparse: true, unique: true },
    firstName: String,
    lastName: String,
    displayName: String,
    avatar: String,
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.VIEWER,
      index: true,
    },
    permissions: [
      {
        type: String,
        enum: Object.values(PermissionType),
      },
    ],
    organizationId: { type: String, required: true, index: true },
    teamIds: [{ type: String }],
    isActive: { type: Boolean, default: true, index: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, select: false },
    mfaBackupCodes: [{ type: String, select: false }],
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    passwordChangedAt: Date,
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    settings: UserSettingsSchema,
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

// Indexes
UserSchema.index({ organizationId: 1, role: 1 });
UserSchema.index({ organizationId: 1, isActive: 1 });
UserSchema.index({ email: 1, isActive: 1 });

// Virtual for full name
UserSchema.virtual('fullName').get(function (this: IUserDocument) {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.displayName || this.username || this.email;
});

// Password hashing middleware
UserSchema.pre('save', async function (this: IUserDocument, next) {
  // Only hash the password if it has been modified
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password!, salt);
    this.passwordChangedAt = new Date();
    next();
  } catch (error: any) {
    next(error);
  }
});

// Password comparison method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (_error) {
    return false;
  }
};

// Check if password changed after JWT was issued
UserSchema.methods.changedPasswordAfter = function (JWTTimestamp: number): boolean {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt((this.passwordChangedAt.getTime() / 1000).toString(), 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Account lockout handling
UserSchema.methods.incLoginAttempts = function () {
  // Reset attempts and lock if we've reached max attempts and we're not locked
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    return this.updateOne({
      $set: { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }, // Lock for 2 hours
      $inc: { loginAttempts: 1 },
    });
  }
  // Otherwise just increment
  return this.updateOne({ $inc: { loginAttempts: 1 } });
};

UserSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

// Virtual to check if account is locked
UserSchema.virtual('isLocked').get(function (this: IUserDocument) {
  return !!(this.lockUntil && this.lockUntil.getTime() > Date.now());
});

export const UserModel = model<IUserDocument>('User', UserSchema);
