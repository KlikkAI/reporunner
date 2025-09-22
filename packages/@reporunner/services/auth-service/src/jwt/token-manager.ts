import { type IJwtPayload, type IUser, PermissionType, UserRole } from '@reporunner/api-types';
import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export interface TokenConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  issuer: string;
  audience?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenData {
  userId: string;
  sessionId: string;
  tokenFamily: string;
  issuedAt: Date;
  expiresAt: Date;
  used: boolean;
}

export class TokenManager {
  private config: TokenConfig;
  private refreshTokenStore: Map<string, RefreshTokenData> = new Map();

  constructor(config: TokenConfig) {
    this.config = config;
  }

  /**
   * Generate access and refresh token pair
   */
  async generateTokenPair(user: IUser, sessionId: string): Promise<TokenPair> {
    const tokenFamily = uuidv4();

    // Generate access token
    const accessToken = await this.generateAccessToken(user, sessionId);

    // Generate refresh token
    const refreshToken = await this.generateRefreshToken(user.id, sessionId, tokenFamily);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getExpiryInSeconds(this.config.accessTokenExpiry),
    };
  }

  /**
   * Generate access token with user claims
   */
  private async generateAccessToken(user: IUser, sessionId: string): Promise<string> {
    const payload: IJwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      organizationId: user.organizationId,
      sessionId,
    };

    const options: jwt.SignOptions = {
      expiresIn: this.config.accessTokenExpiry,
      issuer: this.config.issuer,
      audience: this.config.audience,
      algorithm: 'RS256',
    };

    return jwt.sign(payload, this.config.accessTokenSecret, options);
  }

  /**
   * Generate refresh token
   */
  private async generateRefreshToken(
    userId: string,
    sessionId: string,
    tokenFamily: string
  ): Promise<string> {
    const tokenId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setSeconds(
      expiresAt.getSeconds() + this.getExpiryInSeconds(this.config.refreshTokenExpiry)
    );

    const payload = {
      jti: tokenId,
      sub: userId,
      sessionId,
      tokenFamily,
      type: 'refresh',
    };

    const options: jwt.SignOptions = {
      expiresIn: this.config.refreshTokenExpiry,
      issuer: this.config.issuer,
      algorithm: 'RS256',
    };

    const token = jwt.sign(payload, this.config.refreshTokenSecret, options);

    // Store refresh token data for rotation tracking
    this.refreshTokenStore.set(tokenId, {
      userId,
      sessionId,
      tokenFamily,
      issuedAt: new Date(),
      expiresAt,
      used: false,
    });

    return token;
  }

  /**
   * Verify and decode access token
   */
  async verifyAccessToken(token: string): Promise<IJwtPayload> {
    try {
      const decoded = jwt.verify(token, this.config.accessTokenSecret, {
        issuer: this.config.issuer,
        audience: this.config.audience,
        algorithms: ['RS256'],
      }) as IJwtPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      }
      throw error;
    }
  }

  /**
   * Refresh token rotation for enhanced security
   */
  async refreshTokenRotation(refreshToken: string, user: IUser): Promise<TokenPair> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.config.refreshTokenSecret, {
        issuer: this.config.issuer,
        algorithms: ['RS256'],
      }) as any;

      const tokenData = this.refreshTokenStore.get(decoded.jti);

      if (!tokenData) {
        throw new Error('Refresh token not found');
      }

      if (tokenData.used) {
        // Token reuse detected - potential attack
        this.revokeTokenFamily(tokenData.tokenFamily);
        throw new Error('Refresh token reuse detected - all tokens revoked');
      }

      if (tokenData.userId !== user.id) {
        throw new Error('Token user mismatch');
      }

      // Mark current token as used
      tokenData.used = true;

      // Generate new token pair with same family
      const newSessionId = decoded.sessionId;
      const newTokenFamily = tokenData.tokenFamily;

      // Generate new access token
      const accessToken = await this.generateAccessToken(user, newSessionId);

      // Generate new refresh token in same family
      const newRefreshToken = await this.generateRefreshToken(
        user.id,
        newSessionId,
        newTokenFamily
      );

      return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: this.getExpiryInSeconds(this.config.accessTokenExpiry),
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Revoke all tokens in a family (used when reuse is detected)
   */
  private revokeTokenFamily(tokenFamily: string): void {
    for (const [tokenId, data] of this.refreshTokenStore.entries()) {
      if (data.tokenFamily === tokenFamily) {
        this.refreshTokenStore.delete(tokenId);
      }
    }
  }

  /**
   * Revoke specific session tokens
   */
  revokeSession(sessionId: string): void {
    for (const [tokenId, data] of this.refreshTokenStore.entries()) {
      if (data.sessionId === sessionId) {
        this.refreshTokenStore.delete(tokenId);
      }
    }
  }

  /**
   * Clean up expired tokens
   */
  cleanupExpiredTokens(): void {
    const now = new Date();
    for (const [tokenId, data] of this.refreshTokenStore.entries()) {
      if (data.expiresAt < now) {
        this.refreshTokenStore.delete(tokenId);
      }
    }
  }

  /**
   * Convert expiry string to seconds
   */
  private getExpiryInSeconds(expiry: string): number {
    const units: { [key: string]: number } = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
      w: 604800,
    };

    const match = expiry.match(/^(\d+)([smhdw])$/);
    if (!match) {
      throw new Error(`Invalid expiry format: ${expiry}`);
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    return value * units[unit];
  }

  /**
   * Generate API key
   */
  generateApiKey(): { key: string; hash: string; prefix: string } {
    const key = `rr_${uuidv4().replace(/-/g, '')}`;
    const hash = createHash('sha256').update(key).digest('hex');
    const prefix = key.substring(0, 7);

    return { key, hash, prefix };
  }

  /**
   * Verify API key
   */
  verifyApiKey(key: string, hash: string): boolean {
    const keyHash = createHash('sha256').update(key).digest('hex');
    return keyHash === hash;
  }
}

export default TokenManager;
