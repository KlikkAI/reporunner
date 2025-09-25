passwordPolicy: {
  minLength: {
    type: Number,
    default: 8,
          min: 6,
          max: 32,
  }
  ,
        requireUppercase:
  {
    type: Boolean,
    default: false,
  }
  ,
        requireLowercase:
  {
    type: Boolean,
    default: false,
  }
  ,
        requireNumbers:
  {
    type: Boolean,
    default: false,
  }
  ,
        requireSpecialChars:
  {
    type: Boolean,
    default: false,
  }
  ,
        expirationDays:
  {
    type: Number, min;
    : 30,
          max: 365,
  }
  ,
}
,
      sessionTimeout:
{
  type: Number,
  default: 480, // 8 hours in minutes
        min: 15,
        max: 1440, // 24 hours
}
,
      ssoEnabled:
{
  type: Boolean,
  default: false,
}
,
      ssoProvider:
{
  type: String,
  enum: ['google', 'microsoft', 'okta', 'auth0'],
      }
  ,
      ssoSettings:
  {
    type: Schema.Types.Mixed,
  }
  ,
      auditLogRetention:
  {
    type: Number,
    default: 90, // 90 days
        min: 30,
        max: 365,
  }
  ,
      maxUsers:
  {
    type: Number, min;
    : 1,
  }
  ,
      maxWorkflows:
  {
    type: Number, min;
    : 1,
  }
  ,
      features:
  {
    type: [String],
    default: ['workflows', 'integrations', 'basic_auth'],
  }
  ,
}
,
    billing:
{
  customerId: {
    type: String,
  }
  ,
      subscriptionId:
  {
    type: String,
  }
  ,
      currentPeriodStart:
  {
    type: Date,
  }
  ,
      currentPeriodEnd:
  {
    type: Date,
  }
  ,
      status:
  {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'cancelled'],
        default: 'active',
      }
    ,
  }
  ,
    isActive:
  {
    type: Boolean,
    default: true,
  }
  ,
    ownerId:
  {
    type: String, ref;
    : 'User',
      required: [true, 'Organization owner is required'],
  }
  ,
}
,
{
  timestamps: true, toJSON;
  :
  {
    virtuals: true;
  }
  ,
    toObject:
  {
    virtuals: true;
  }
  ,
}
)
