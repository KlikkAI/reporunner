(credential.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
)

// Check rotation policy
const policy = this.rotationPolicies.get(credential.integrationName);

if (policy?.notifyBeforeExpiry && daysUntilExpiry <= policy.notifyBeforeExpiry) {
  this.emit('credential:expiring_soon', {
    id: credential.id,
    integrationName: credential.integrationName,
    daysUntilExpiry,
    expiresAt: credential.expiresAt,
  });
}

// Check if credential has expired
if (daysUntilExpiry <= 0) {
  credential.isActive = false;
  this.emit('credential:expired', {
    id: credential.id,
    integrationName: credential.integrationName,
  });
}
})
},
      60 * 60 * 1000
    ) // Check every hour
}

  /**
   * Log access
   */
  private logAccess(credentialId: string, action: string, userId?: string): void
{
  this.accessLog.push({
    credentialId,
    timestamp: new Date(),
    action,
    userId,
  });

  // Keep only last 10000 entries
  if (this.accessLog.length > 10000) {
    this.accessLog = this.accessLog.slice(-10000);
  }
}

/**
 * Get access log
 */
getAccessLog(credentialId?: string)
: typeof this.accessLog
{
  if (credentialId) {
    return this.accessLog.filter((entry) => entry.credentialId === credentialId);
  }
  return [...this.accessLog];
}

/**
 * Generate credential ID
 */
private
generateCredentialId();
: string
{
  return `cred_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Export credentials (encrypted)
 */
async;
exportCredentials();
: Promise<string>
{
  const data = {
    credentials: Array.from(this.credentials.entries()),
    policies: Array.from(this.rotationPolicies.entries()),
    exportedAt: new Date(),
  };

  const encrypted = this.encrypt(JSON.stringify(data));
  return JSON.stringify(encrypted);
}

/**
 * Import credentials
 */
async;
importCredentials(encryptedExport: string)
: Promise<number>
{
    try {
      const encryptedData = JSON.parse(encryptedExport);
      const decrypted = this.decrypt(encryptedData);
      const data = JSON.parse(decrypted);

      let imported = 0;

      // Import credentials
      for (const [id, credential] of data.credentials) {
        this.credentials.set(id, credential);
        imported++;
      }

      // Import policies
      for (const [name, policy] of data.policies) {
        this.rotationPolicies.set(name, policy);
      }

      this.emit('credentials:imported', { count: imported });
