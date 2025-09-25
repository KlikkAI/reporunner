import * as crypto from 'node:crypto';

export interface TwoFactorSecret {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export class TwoFactorService {
  private secrets: Map<string, string> = new Map();
  private backupCodes: Map<string, Set<string>> = new Map();

  /**
   * Generate a new two-factor secret for a user
   */
  setup(userEmail: string): TwoFactorSecret {
    const secret = this.generateSecret();
    const qrCode = this.generateQRCodeUrl(userEmail, secret);
    const backupCodes = this.generateBackupCodes();

    // Store temporarily for verification
    this.secrets.set(userEmail, secret);
    this.backupCodes.set(userEmail, new Set(backupCodes));

    return {
      secret,
      qrCode,
      backupCodes,
    };
  }

  /**
   * Verify a TOTP token
   */
  async verifyToken(userId: string, token: string): Promise<boolean> {
    const secret = this.secrets.get(userId);
    if (!secret) {
      return false;
    }

    // Simple mock verification for now
    // In production, use a proper TOTP library like speakeasy or otplib
    const expectedToken = this.generateTOTP(secret);
    return token === expectedToken;
  }

  /**
   * Verify a backup code
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const codes = this.backupCodes.get(userId);
    if (!codes || !codes.has(code)) {
      return false;
    }

    // Remove used backup code
    codes.delete(code);
    return true;
  }

  /**
   * Generate a random secret
   */
  private generateSecret(): string {
    return crypto.randomBytes(32).toString('base64');
  }

  /**
   * Generate a QR code URL for Google Authenticator
   */
  private generateQRCodeUrl(email: string, secret: string): string {
    const issuer = 'Reporunner';
    const algorithm = 'SHA1';
    const digits = 6;
    const period = 30;

    const params = new URLSearchParams({
      secret,
      issuer,
      algorithm,
      digits: digits.toString(),
      period: period.toString(),
    });

    const otpauth = `otpauth://totp/${issuer}:${email}?${params}`;
    const qrCodeUrl = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(
      otpauth
    )}`;

    return qrCodeUrl;
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(count = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = crypto
        .randomBytes(4)
        .toString('hex')
        .toUpperCase()
        .match(/.{4}/g)
        ?.join('-') || '';
      codes.push(code);
    }
    return codes;
  }

  /**
   * Simple TOTP generation (mock implementation)
   */
  private generateTOTP(secret: string): string {
    // Mock implementation - in production use a proper TOTP library
    const time = Math.floor(Date.now() / 30000);
    const hash = crypto
      .createHmac('sha1', secret)
      .update(time.toString())
      .digest('hex');
    
    return hash.substring(0, 6);
  }

  /**
   * Disable two-factor for a user
   */
  disable(userId: string): void {
    this.secrets.delete(userId);
    this.backupCodes.delete(userId);
  }

  /**
   * Check if user has two-factor enabled
   */
  isEnabled(userId: string): boolean {
    return this.secrets.has(userId);
  }

  /**
   * Regenerate backup codes for a user
   */
  regenerateBackupCodes(userId: string): string[] {
    const codes = this.generateBackupCodes();
    this.backupCodes.set(userId, new Set(codes));
    return codes;
  }

  /**
   * Get remaining backup codes count
   */
  getRemainingBackupCodesCount(userId: string): number {
    const codes = this.backupCodes.get(userId);
    return codes ? codes.size : 0;
  }
}