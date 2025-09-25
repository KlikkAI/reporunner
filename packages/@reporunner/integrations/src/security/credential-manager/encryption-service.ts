private
decrypt(encryptedData: EncryptedData)
: string
{
  const decipher = crypto.createDecipheriv(
    encryptedData.algorithm,
    this.encryptionKey,
    Buffer.from(encryptedData.iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Store credential
 */
async;
storeCredential(
    integrationName: string,
    userId: string,
    type: Credential['type'],
    name: string,
    value: string,
    metadata?: Record<string, any>,
    expiresAt?: Date,
    tags?: string[]
  )
: Promise<string>
{
  const id = this.generateCredentialId();

  // Encrypt the credential value
  const encryptedData = this.encrypt(value);
  const encryptedValue = JSON.stringify(encryptedData);

  const credential: Credential = {
    id,
    integrationName,
    userId,
    type,
    name,
    value: encryptedValue,
    metadata,
    expiresAt,
    createdAt: new Date(),
    updatedAt: new Date(),
    accessCount: 0,
    tags,
    isActive: true,
  };

  this.credentials.set(id, credential);

  // Log the action
  this.logAccess(id, 'create', userId);

  this.emit('credential:created', {
    id,
    integrationName,
    userId,
    type,
    name,
  });

  return id;
}

/**
 * Retrieve credential
 */
async;
retrieveCredential(
    id: string,
    userId?: string,
    decrypt: boolean = true
  )
: Promise<Partial<Credential> | null>
{
    const credential = this.credentials.get(id);

    if (!credential || !credential.isActive) {
      return null;
    }

    // Check if credential is expired
    if (credential.expiresAt && new Date() > credential.expiresAt) {
      this.emit('credential:expired', {
        id,
        integrationName: credential.integrationName,
      });
      return null;
    }

    // Update access information
    credential.lastAccessedAt = new Date();
    credential.accessCount++;

    // Log the access
    this.logAccess(id, 'retrieve', userId);

    // Return credential with decrypted value if requested
    const result = { ...credential };

    if (decrypt) {
