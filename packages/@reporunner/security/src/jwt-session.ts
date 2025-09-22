import jwt, { JwtPayload, SignOptions, VerifyOptions } from "jsonwebtoken";
import { randomBytes } from "crypto";
import { promisify } from "util";
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
      accessTokenExpiry: "15m",
      refreshTokenExpiry: "7d",
      issuer: "reporunner",
      audience: "reporunner-api",
      algorithm: "HS256" as jwt.Algorithm,
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
      type: "access",
    };

    // Prepare refresh token payload
    const refreshTokenPayload = {
      userId: payload.userId,
      sessionId,
      tokenId,
      type: "refresh",
      refreshCount: 0,
    };

    // Generate tokens
    const accessToken = this.signToken(accessTokenPayload, {
      expiresIn: this.config.accessTokenExpiry as string | number,
      subject: payload.userId,
    });

    const refreshToken = this.signToken(
      refreshTokenPayload,
      {
        expiresIn: this.config.refreshTokenExpiry,
        subject: payload.userId,
      },
      true,
    );

    // Calculate expiry dates
    const accessTokenExpiry = this.getExpiryDate(this.config.accessTokenExpiry);
    const refreshTokenExpiry = this.getExpiryDate(
      this.config.refreshTokenExpiry,
    );

    // Store refresh token data
    const refreshTokenData: RefreshTokenData = {
      tokenId,
      userId: payload.userId,
      sessionId,
      refreshCount: 0,
      issuedAt: new Date(),
      expiresAt: refreshTokenExpiry,
    };

    this.refreshTokenStore.set(tokenId, refreshTokenData);

    // Track user session
    this.addUserSession(payload.userId, sessionId);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiry,
      refreshTokenExpiry,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    try {
      // Verify refresh token
      const decoded = this.verifyToken(refreshToken, true) as JwtPayload;

      if (decoded.type !== "refresh") {
        throw new Error("Invalid token type");
      }

      const tokenId = decoded.tokenId;
      const refreshTokenData = this.refreshTokenStore.get(tokenId);

      if (!refreshTokenData) {
        throw new Error("Refresh token not found or expired");
      }

      // Check if token is blacklisted
      if (this.config.enableBlacklist && this.blacklistedTokens.has(tokenId)) {
        throw new Error("Token has been revoked");
      }

      // Check refresh count
      if (refreshTokenData.refreshCount >= this.config.maxRefreshCount) {
        throw new Error("Maximum refresh count exceeded");
      }

      // Update refresh token data
      refreshTokenData.refreshCount++;
      refreshTokenData.lastUsedAt = new Date();
      if (ipAddress) refreshTokenData.ipAddress = ipAddress;
      if (userAgent) refreshTokenData.userAgent = userAgent;

      // Generate new access token
      const newAccessTokenPayload: SessionPayload = {
        userId: decoded.userId,
        sessionId: decoded.sessionId,
        tokenId: this.config.enableRotation
          ? await this.generateTokenId()
          : tokenId,
        type: "access",
      };

      const newAccessToken = this.signToken(newAccessTokenPayload, {
        expiresIn: this.config.accessTokenExpiry as string | number,
        subject: decoded.userId,
      });

      const accessTokenExpiry = this.getExpiryDate(
        this.config.accessTokenExpiry,
      );

      // Rotate refresh token if enabled
      let newRefreshToken = refreshToken;
      let refreshTokenExpiry = refreshTokenData.expiresAt;

      if (this.config.enableRotation) {
        const newTokenId = await this.generateTokenId();
        const newRefreshTokenPayload = {
          userId: decoded.userId,
          sessionId: decoded.sessionId,
          tokenId: newTokenId,
          type: "refresh",
          refreshCount: refreshTokenData.refreshCount,
        };

        newRefreshToken = this.signToken(
          newRefreshTokenPayload,
          {
            expiresIn: String(this.config.refreshTokenExpiry),
            subject: decoded.userId,
          },
          true,
        );

        refreshTokenExpiry = this.getExpiryDate(this.config.refreshTokenExpiry);

        // Update token store
        this.refreshTokenStore.delete(tokenId);
        this.refreshTokenStore.set(newTokenId, {
          ...refreshTokenData,
          tokenId: newTokenId,
          expiresAt: refreshTokenExpiry,
        });

        // Blacklist old refresh token
        if (this.config.enableBlacklist) {
          this.blacklistedTokens.add(tokenId);
        }
      } else {
        // Update existing token data
        this.refreshTokenStore.set(tokenId, refreshTokenData);
      }

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        accessTokenExpiry,
        refreshTokenExpiry,
      };
    } catch (error: any) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Verify and decode a token
   */
  verifyToken(token: string, isRefreshToken: boolean = false): JwtPayload {
    try {
      const secret = isRefreshToken
        ? this.config.refreshTokenSecret
        : this.config.accessTokenSecret;

      const options: VerifyOptions = {
        issuer: this.config.issuer,
        audience: this.config.audience,
        algorithms: [this.config.algorithm],
      };

      const decoded = jwt.verify(token, secret, options) as JwtPayload;

      // Check if token is blacklisted
      if (this.config.enableBlacklist && decoded.tokenId) {
        if (this.blacklistedTokens.has(decoded.tokenId)) {
          throw new Error("Token has been revoked");
        }
      }

      return decoded;
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        throw new Error("Token has expired");
      } else if (error.name === "JsonWebTokenError") {
        throw new Error("Invalid token");
      }
      throw error;
    }
  }

  /**
   * Revoke a token (add to blacklist)
   */
  revokeToken(tokenId: string): void {
    if (this.config.enableBlacklist) {
      this.blacklistedTokens.add(tokenId);

      // Also remove from refresh token store
      const refreshTokenData = this.refreshTokenStore.get(tokenId);
      if (refreshTokenData) {
        this.refreshTokenStore.delete(tokenId);

        // Remove from user sessions
        const userSessions = this.userSessions.get(refreshTokenData.userId);
        if (userSessions) {
          userSessions.delete(refreshTokenData.sessionId);
        }
      }
    }
  }

  /**
   * Revoke all tokens for a user
   */
  revokeAllUserTokens(userId: string): void {
    const userSessions = this.userSessions.get(userId);
    if (userSessions) {
      for (const sessionId of userSessions) {
        // Find and revoke all tokens for this session
        for (const [tokenId, data] of this.refreshTokenStore) {
          if (data.userId === userId && data.sessionId === sessionId) {
            this.revokeToken(tokenId);
          }
        }
      }
      this.userSessions.delete(userId);
    }
  }

  /**
   * Revoke a specific session
   */
  revokeSession(sessionId: string): void {
    for (const [tokenId, data] of this.refreshTokenStore) {
      if (data.sessionId === sessionId) {
        this.revokeToken(tokenId);
      }
    }
  }

  /**
   * Get all active sessions for a user
   */
  getUserSessions(userId: string): RefreshTokenData[] {
    const sessions: RefreshTokenData[] = [];
    const userSessionIds = this.userSessions.get(userId);

    if (userSessionIds) {
      for (const [_, data] of this.refreshTokenStore) {
        if (data.userId === userId && userSessionIds.has(data.sessionId)) {
          sessions.push(data);
        }
      }
    }

    return sessions;
  }

  /**
   * Validate token without throwing
   */
  async validateToken(
    token: string,
    isRefreshToken: boolean = false,
  ): Promise<{
    valid: boolean;
    payload?: JwtPayload;
    error?: string;
  }> {
    try {
      const payload = this.verifyToken(token, isRefreshToken);
      return { valid: true, payload };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) return null;

    const parts = authHeader.split(" ");
    if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
      return parts[1];
    }

    return null;
  }

  /**
   * Sign a token
   */
  private signToken(
    payload: any,
    options: SignOptions,
    isRefreshToken: boolean = false,
  ): string {
    const secret = isRefreshToken
      ? this.config.refreshTokenSecret
      : this.config.accessTokenSecret;

    const signOptions: SignOptions = {
      ...options,
      issuer: this.config.issuer,
      audience: this.config.audience,
      algorithm: this.config.algorithm,
    };

    return jwt.sign(payload, secret, signOptions);
  }

  /**
   * Generate a unique session ID
   */
  private async generateSessionId(): Promise<string> {
    const bytes = await randomBytesAsync(32);
    return bytes.toString("hex");
  }

  /**
   * Generate a unique token ID
   */
  private async generateTokenId(): Promise<string> {
    const bytes = await randomBytesAsync(16);
    return bytes.toString("hex");
  }

  /**
   * Calculate expiry date from duration string
   */
  private getExpiryDate(duration: string): Date {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid duration format: ${duration}`);
    }

    const value = parseInt(match[1]);
    const unit = match[2];
    const now = new Date();

    switch (unit) {
      case "s":
        now.setSeconds(now.getSeconds() + value);
        break;
      case "m":
        now.setMinutes(now.getMinutes() + value);
        break;
      case "h":
        now.setHours(now.getHours() + value);
        break;
      case "d":
        now.setDate(now.getDate() + value);
        break;
    }

    return now;
  }

  /**
   * Add user session tracking
   */
  private addUserSession(userId: string, sessionId: string): void {
    let sessions = this.userSessions.get(userId);
    if (!sessions) {
      sessions = new Set();
      this.userSessions.set(userId, sessions);
    }
    sessions.add(sessionId);
  }

  /**
   * Start cleanup interval for expired tokens
   */
  private startCleanupInterval(): void {
    setInterval(
      () => {
        const now = new Date();

        // Clean expired refresh tokens
        for (const [tokenId, data] of this.refreshTokenStore) {
          if (data.expiresAt < now) {
            this.refreshTokenStore.delete(tokenId);

            // Remove from user sessions
            const userSessions = this.userSessions.get(data.userId);
            if (userSessions) {
              userSessions.delete(data.sessionId);
              if (userSessions.size === 0) {
                this.userSessions.delete(data.userId);
              }
            }
          }
        }

        // Clean blacklisted tokens older than max refresh token expiry
        // (They would be expired anyway)
        if (this.blacklistedTokens.size > 1000) {
          // Keep only last 1000 blacklisted tokens
          const tokensArray = Array.from(this.blacklistedTokens);
          this.blacklistedTokens = new Set(tokensArray.slice(-1000));
        }
      },
      60 * 60 * 1000,
    ); // Run every hour
  }

  /**
   * Get session statistics
   */
  getStatistics(): {
    totalSessions: number;
    totalUsers: number;
    blacklistedTokens: number;
    averageRefreshCount: number;
  } {
    let totalRefreshCount = 0;
    let sessionCount = 0;

    for (const data of this.refreshTokenStore.values()) {
      totalRefreshCount += data.refreshCount;
      sessionCount++;
    }

    return {
      totalSessions: sessionCount,
      totalUsers: this.userSessions.size,
      blacklistedTokens: this.blacklistedTokens.size,
      averageRefreshCount:
        sessionCount > 0 ? totalRefreshCount / sessionCount : 0,
    };
  }

  /**
   * Clear all sessions (use with caution)
   */
  clearAllSessions(): void {
    this.refreshTokenStore.clear();
    this.userSessions.clear();
    this.blacklistedTokens.clear();
  }
}

// Export singleton instance with default config
export const jwtSessionManager = new JWTSessionManager({
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || "change-this-secret",
  refreshTokenSecret:
    process.env.JWT_REFRESH_SECRET || "change-this-refresh-secret",
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || "15m",
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || "7d",
});

export default JWTSessionManager;
