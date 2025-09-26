},
    lastUsed:
{
  type: Date,
}
,
    lastTestedAt:
{
  type: Date,
}
,
  },
{
  timestamps: true, toJSON;
  :
    virtuals: true
  ,
    toObject:
    virtuals: true
  ,
}
)

// Indexes for performance
credentialSchema.index(
{
  userId: 1, integration;
  : 1
}
)
credentialSchema.index(
{
  userId: 1, isActive;
  : 1
}
)
credentialSchema.index(
{
  expiresAt: 1;
}
)

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
  } catch (_error) {
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
