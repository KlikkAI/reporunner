userSchema.pre('save', function (next) {
  if (this.isModified('password') && !this.isNew) {
    this.lastPasswordChange = new Date();
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user has specific permission
userSchema.methods.hasPermission = function (permission: string): boolean {
  // Super admin has all permissions
  if (this.role === 'super_admin') return true;

  // Check if user has the specific permission
  return this.permissions.includes(permission);
};

// Method to check if account is locked
userSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Static method to handle failed login attempts
userSchema.methods.incLoginAttempts = function () {
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours

  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { failedLoginAttempts: 1 },
    });
  }

  const updates = { $inc: { failedLoginAttempts: 1 } };

  // If we've hit max attempts and it's not locked already, lock the account
  if (this.failedLoginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    (updates as any).$set = { lockUntil: new Date(Date.now() + lockTime) };
  }

  return this.updateOne(updates);
};

// Static method to reset login attempts
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: { failedLoginAttempts: 1, lockUntil: 1 },
  });
};

// Remove sensitive data from JSON output
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  userObject.password = undefined;
  userObject.refreshTokens = undefined;
  userObject.emailVerificationToken = undefined;
  userObject.emailVerificationTokenExpires = undefined;
  userObject.passwordResetToken = undefined;
  userObject.passwordResetTokenExpires = undefined;
  return userObject;
};

export const User = mongoose.model<IUser>('User', userSchema);
