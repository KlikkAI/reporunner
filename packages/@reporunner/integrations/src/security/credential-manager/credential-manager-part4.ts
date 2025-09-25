const oldCredential = this.credentials.get(id);

if (!oldCredential) {
  throw new Error('Credential not found');
}

// Create new credential with same metadata
const newId = await this.storeCredential(
  oldCredential.integrationName,
  oldCredential.userId,
  oldCredential.type,
  oldCredential.name,
  newValue,
  oldCredential.metadata,
  oldCredential.expiresAt,
  oldCredential.tags
);

// Mark old credential as rotated
oldCredential.isActive = false;
oldCredential.metadata = {
  ...oldCredential.metadata,
  rotatedTo: newId,
  rotatedAt: new Date(),
};

this.emit('credential:rotated', {
  oldId: id,
  newId,
  integrationName: oldCredential.integrationName,
});

return newId;
}

  /**
   * Find credentials
   */
  findCredentials(filter: CredentialFilter): Credential[]
{
  const results: Credential[] = [];

  this.credentials.forEach((credential) => {
    // Apply filters
    if (filter.integrationName && credential.integrationName !== filter.integrationName) {
      return;
    }
    if (filter.userId && credential.userId !== filter.userId) {
      return;
    }
    if (filter.type && credential.type !== filter.type) {
      return;
    }
    if (filter.isActive !== undefined && credential.isActive !== filter.isActive) {
      return;
    }
    if (!filter.includeExpired && credential.expiresAt && new Date() > credential.expiresAt) {
      return;
    }
    if (filter.tags && filter.tags.length > 0) {
      const hasAllTags = filter.tags.every((tag) => credential.tags?.includes(tag));
      if (!hasAllTags) {
        return;
      }
    }

    // Don't include the encrypted value in search results
    const result = { ...credential };
    (result as any).value = undefined;
    results.push(result);
  });

  return results;
}

/**
 * Set rotation policy
 */
setRotationPolicy(integrationName: string, policy: CredentialRotationPolicy)
: void
{
  this.rotationPolicies.set(integrationName, policy);

  this.emit('policy:set', {
    integrationName,
    policy,
  });
}

/**
 * Check for expiring credentials
 */
private
startExpiryChecker();
: void
{
    setInterval(
      () => {
        const now = new Date();

        this.credentials.forEach((credential) => {
          if (!credential.isActive || !credential.expiresAt) {
            return;
          }

          const daysUntilExpiry = Math.ceil(
