return imported;
} catch (error: any)
{
  throw new Error(`Failed to import credentials: ${error.message}`);
}
}

  /**
   * Get statistics
   */
  getStatistics():
{
  totalCredentials: number;
  activeCredentials: number;
  expiredCredentials: number;
  credentialsByType: Record<string, number>;
  credentialsByIntegration: Record<string, number>;
  recentAccesses: number;
}
{
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const stats = {
    totalCredentials: this.credentials.size,
    activeCredentials: 0,
    expiredCredentials: 0,
    credentialsByType: {} as Record<string, number>,
    credentialsByIntegration: {} as Record<string, number>,
    recentAccesses: this.accessLog.filter((entry) => entry.timestamp > oneDayAgo).length,
  };

  this.credentials.forEach((credential) => {
    if (credential.isActive) {
      if (credential.expiresAt && credential.expiresAt < now) {
        stats.expiredCredentials++;
      } else {
        stats.activeCredentials++;
      }
    }

    stats.credentialsByType[credential.type] = (stats.credentialsByType[credential.type] || 0) + 1;
    stats.credentialsByIntegration[credential.integrationName] =
      (stats.credentialsByIntegration[credential.integrationName] || 0) + 1;
  });

  return stats;
}

/**
 * Clear all credentials
 */
clearAll();
: void
{
  this.credentials.clear();
  this.rotationPolicies.clear();
  this.accessLog = [];
}
}

// Singleton instance
let credentialManagerInstance: CredentialManager | null = null;

export function getCredentialManager(masterKey?: string): CredentialManager {
  if (!credentialManagerInstance) {
    credentialManagerInstance = new CredentialManager(masterKey);
  }
  return credentialManagerInstance;
}

export default CredentialManager;
