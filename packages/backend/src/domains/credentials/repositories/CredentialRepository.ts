import { Credential } from '../../../models/Credentials.js';

export class CredentialRepository {
  /**
   * Find credentials by user ID
   */
  async findByUserId(userId: string) {
    return Credential.find({ userId });
  }

  /**
   * Find all credentials for debug (select only basic fields)
   */
  async findAllDebug() {
    return Credential.find({}).select('_id name userId integration isActive createdAt');
  }

  /**
   * Create a new credential
   */
  async create(credentialData: any) {
    const credential = new Credential(credentialData);
    return credential.save();
  }

  /**
   * Find credential by ID and user ID
   */
  async findByIdAndUserId(id: string, userId: string) {
    return Credential.findOne({ _id: id, userId });
  }

  /**
   * Find credential by ID and user ID with encrypted data
   */
  async findByIdAndUserIdWithData(id: string, userId: string) {
    return Credential.findOne({ _id: id, userId }).select('+data');
  }

  /**
   * Update credential by ID
   */
  async updateById(id: string, updateData: any) {
    const credential = await Credential.findById(id);
    if (!credential) {
      throw new Error('Credential not found');
    }

    const { name, data, expiresAt, isActive } = updateData;

    if (name) credential.name = name;
    if (data) credential.data = credential.encrypt(data);
    if (expiresAt) credential.expiresAt = new Date(expiresAt);
    if (isActive !== undefined) credential.isActive = isActive;

    return credential.save();
  }

  /**
   * Find one credential and delete
   */
  async findOneAndDelete(id: string, userId: string) {
    return Credential.findOneAndDelete({ _id: id, userId });
  }

  /**
   * Update test result for credential
   */
  async updateTestResult(id: string, isValid: boolean) {
    return Credential.findByIdAndUpdate(id, {
      lastTestedAt: new Date(),
      isValid: isValid
    });
  }

  /**
   * Find Gmail credential by ID and user ID
   */
  async findGmailCredential(id: string, userId: string) {
    return Credential.findOne({
      _id: id,
      userId,
      integration: 'gmailOAuth2',
      isActive: true
    }).select('+data');
  }

  /**
   * Find active Gmail credential for user
   */
  async findActiveGmailCredential(userId: string) {
    return Credential.findOne({
      userId,
      integration: 'gmailOAuth2',
      isActive: true
    }).select('+data');
  }

  /**
   * Find credential by ID only
   */
  async findById(id: string) {
    return Credential.findById(id).select('userId integration isActive');
  }

  /**
   * Mark credential as used
   */
  async markAsUsed(id: string) {
    const credential = await Credential.findById(id);
    if (credential) {
      return credential.markAsUsed();
    }
    return null;
  }
}