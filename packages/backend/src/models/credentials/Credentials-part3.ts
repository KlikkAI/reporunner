} catch (error: any)
{
  console.error('Failed to decrypt credential data:', error);

  // Provide more specific error message
  if (error.code === 'ERR_OSSL_BAD_DECRYPT') {
    throw new Error(
      'Failed to decrypt credential data. The credential may be corrupted or using an outdated encryption method.'
    );
  } else if (error.message.includes('JSON')) {
    throw new Error('Failed to parse decrypted credential data. The credential may be corrupted.');
  } else {
    throw new Error(`Failed to decrypt credential data: ${error.message}`);
  }
}
}

// Pre-save middleware to encrypt data
credentialSchema.pre('save', async
function (next) {
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
}
)

// Method to get decrypted data
credentialSchema.methods.getDecryptedData =
function (): Record<string, any> {
  if (!this.data) return {};
  return this.decrypt(this.data);
}

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
credentialSchema.methods.refreshOAuth2Token = async function (_refreshToken: string) {
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
  credentialObject.data = undefined;
  return credentialObject;
};

export const Credential = mongoose.model<ICredential>('Credential', credentialSchema);
