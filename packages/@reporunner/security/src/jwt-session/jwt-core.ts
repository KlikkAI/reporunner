import { randomBytes } from 'node:crypto';
import { promisify } from 'node:util';
import jwt, { type JwtPayload, type SignOptions, type VerifyOptions } from 'jsonwebtoken';

// Removed unused ERROR_CODES import

const randomBytesAsync = promisify(randomBytes);

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: Date;
  refreshTokenExpiry: Date;
}

export interface SessionPayload {
  userId: string;
  email?: string;
  roles?: string[];
  permissions?: string[];
  sessionId?: string;
  [key: string]: any;
}

export interface JWTConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiry?: string; // e.g., '15m', '1h'
  refreshTokenExpiry?: string; // e.g., '7d', '30d'
  issuer?: string;
  audience?: string;
  algorithm?: jwt.Algorithm;
  enableBlacklist?: boolean;
  enableRotation?: boolean;
  maxRefreshCount?: number;
}

export interface RefreshTokenData {
  tokenId: string;
  userId: string;
  sessionId: string;
  refreshCount: number;
  issuedAt: Date;
  expiresAt: Date;
  lastUsedAt?: Date;
  userAgent?: string;
  ipAddress?: string;
}

export class JWTSessionManager {
  private config: Required<JWTConfig>;
  private blacklistedTokens: Set<string> = new Set();
  private refreshTokenStore: Map<string, RefreshTokenData> = new Map();
  private userSessions: Map<string, Set<string>> = new Map();

  constructor(config: JWTConfig) {
    this.config = {
      accessTokenExpiry: '15m',
      refreshTokenExpiry: '7d',
      issuer: 'reporunner',
      audience: 'reporunner-api',
      algorithm: 'HS256' as jwt.Algorithm,
      enableBlacklist: true,
      enableRotation: true,
      maxRefreshCount: 10,
      ...config,
    };

    // Start cleanup interval for expired tokens
    this.startCleanupInterval();
  }

  /**
   * Generate a new token pair (access + refresh tokens)
   */
  async generateTokenPair(payload: SessionPayload): Promise<TokenPair> {
    const sessionId = payload.sessionId || (await this.generateSessionId());
    const tokenId = await this.generateTokenId();

    // Prepare access token payload
    const accessTokenPayload = {
      ...payload,
      sessionId,
      tokenId,
      type: 'access',
    };

    // Prepare refresh token payload
    const refreshTokenPayload = {
      userId: payload.userId,
      sessionId,
      tokenId,
      type: 'refresh',
      refreshCount: 0,
    };

    // Generate tokens
    const accessToken = this.signToken(accessTokenPayload, {
      expiresIn: this.config.accessTokenExpiry as any,
      subject: payload.userId,
