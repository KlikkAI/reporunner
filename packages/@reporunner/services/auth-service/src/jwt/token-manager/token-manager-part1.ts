import { createHash } from 'node:crypto';
import type { IJwtPayload, IUser } from '@reporunner/api-types';
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
