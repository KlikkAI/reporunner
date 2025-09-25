try {
  const encryptedData = JSON.parse(credential.value);
  result.value = this.decrypt(encryptedData);
} catch (error: any) {
  this.emit('credential:decrypt_error', { id, error: error.message });
  throw new Error(`Failed to decrypt credential: ${error.message}`);
}
} else
{
  // Don't return the encrypted value if not decrypting
  result.value = undefined;
}

return result;
}

  /**
   * Update credential
   */
  async updateCredential(
    id: string,
    updates:
{
  value?: string;
  metadata?: Record<string, any>;
  expiresAt?: Date;
  tags?: string[];
}
): Promise<boolean>
{
  const credential = this.credentials.get(id);

  if (!credential) {
    return false;
  }

  // Encrypt new value if provided
  if (updates.value) {
    const encryptedData = this.encrypt(updates.value);
    credential.value = JSON.stringify(encryptedData);
  }

  // Update other fields
  if (updates.metadata !== undefined) {
    credential.metadata = updates.metadata;
  }
  if (updates.expiresAt !== undefined) {
    credential.expiresAt = updates.expiresAt;
  }
  if (updates.tags !== undefined) {
    credential.tags = updates.tags;
  }

  credential.updatedAt = new Date();

  // Log the action
  this.logAccess(id, 'update');

  this.emit('credential:updated', {
    id,
    integrationName: credential.integrationName,
  });

  return true;
}

/**
 * Delete credential
 */
async;
deleteCredential(id: string)
: Promise<boolean>
{
  const credential = this.credentials.get(id);

  if (!credential) {
    return false;
  }

  // Soft delete by marking as inactive
  credential.isActive = false;
  credential.updatedAt = new Date();

  // Log the action
  this.logAccess(id, 'delete');

  // Optionally, permanently delete after a delay
  setTimeout(
    () => {
      this.credentials.delete(id);
    },
    7 * 24 * 60 * 60 * 1000
  ); // Delete after 7 days

  this.emit('credential:deleted', {
    id,
    integrationName: credential.integrationName,
  });

  return true;
}

/**
 * Rotate credential
 */
async;
rotateCredential(id: string, newValue: string)
: Promise<string>
{
