import jwt from 'jsonwebtoken';
import { AuthenticationError } from '@reporunner/core';

export interface TokenConfig {
  secret: string;
  expiresIn: string | number;
  refreshExpiresIn: string | number;
  algorithm?: string;
}

export interface TokenPayload {
  sub: string;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

export class TokenService {
  private config: Required<TokenConfig>;

  constructor(config?: TokenConfig) {
    if (!config?.secret) {
      throw new Error('Token secret is required');
    }

    this.config = {
      secret: config.secret,
      expiresIn: config.expiresIn || '1h',
      refreshExpiresIn: config.refreshExpiresIn || '7d',
      algorithm: config.algorithm || 'HS256'
    };
  }

  /**
   * Generate access token
   */
  public async generateToken(payload: TokenPayload): Promise<string> {
    return jwt.sign(payload, this.config.secret, {
      expiresIn: this.config.expiresIn,
      algorithm: this.config.algorithm as jwt.Algorithm
    });
  }

  /**
   * Generate refresh token
   */
  public async generateRefreshToken(payload: TokenPayload): Promise<string> {
    return jwt.sign(payload, this.config.secret, {
      expiresIn: this.config.refreshExpiresIn,
      algorithm: this.config.algorithm as jwt.Algorithm
    });
  }

  /**
   * Verify and decode token
   */
  public async verifyAndDecode(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, this.config.secret, {
        algorithms: [this.config.algorithm as jwt.Algorithm]
      });

      return decoded as TokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Decode token without verification
   */
  public decodeToken(token: string): TokenPayload {
    const decoded = jwt.decode(token);
    if (!decoded) {
      throw new AuthenticationError('Invalid token format');
    }
    return decoded as TokenPayload;
  }

  /**
   * Check if token is expired
   */
  public isTokenExpired(token: string): boolean {
    try {
      jwt.verify(token, this.config.secret, {
        algorithms: [this.config.algorithm as jwt.Algorithm]
      });
      return false;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return true;
      }
      throw error;
    }
  }

  /**
   * Get token expiration time
   */
  public getTokenExpiration(token: string): Date {
    const decoded = this.decodeToken(token);
    if (!decoded.exp) {
      throw new AuthenticationError('Token has no expiration');
    }
    return new Date(decoded.exp * 1000);
  }

  /**
   * Blacklist a token
   */
  public async blacklistToken(token: string): Promise<void> {
    // Implement token blacklisting (e.g., using Redis)
    // This is just a placeholder
    // TODO: Implement actual blacklisting
  }
}