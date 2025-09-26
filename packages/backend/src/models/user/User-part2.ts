type: String, select;
: false,
    },
    emailVerificationTokenExpires:
{
  type: Date, select;
  : false,
}
,
    passwordResetToken:
{
  type: String, select;
  : false,
}
,
    passwordResetTokenExpires:
{
  type: Date, select;
  : false,
}
,
    refreshTokens:
{
  type: [String],
  default: [],
      select: false,
}
,
    lastLogin:
{
  type: Date,
}
,
    lastPasswordChange:
{
  type: Date,
}
,
    failedLoginAttempts:
{
  type: Number,
  default: 0,
}
,
    lockUntil:
{
  type: Date,
}
,
    ssoProvider:
{
      type: String,
      enum: ['google', 'microsoft', 'okta', 'auth0'],
    },
    ssoId: 
      type: String,,
    preferences: 
        type: String,
        default: 'en',,
      timezone: 
        type: String,
        default: 'UTC',,
      theme: 
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system',
      },
      notifications: 
          type: Boolean,
          default: true,,
        push: 
          type: Boolean,
          default: true,,
        workflow: 
          type: Boolean,
          default: true,,,,,
    timestamps: true,
    toJSON: virtuals: true ,
    toObject: virtuals: true ,
);

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Indexes for performance
userSchema.index({ isActive: 1 });
userSchema.index({ organizationId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ ssoProvider: 1, ssoId: 1 });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ passwordResetToken: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

// Pre-save middleware to set password change date
