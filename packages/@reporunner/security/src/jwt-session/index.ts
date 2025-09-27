// Simplified JWT session exports - using existing interface from auth-utilities

export interface JWTSessionManager {
  verifyToken(token: string): Promise<any>;
  createToken(payload: any): Promise<string>;
  refreshToken(token: string): Promise<string>;
  revokeToken(token: string): Promise<void>;

  // Additional methods used by auth.middleware.ts - reusing the same interface
  extractTokenFromHeader(authorization: string): string | null;
  refreshAccessToken(refreshToken: string, ipAddress?: string, userAgent?: string): Promise<{ accessToken: string; refreshToken: string }>;
  revokeAllUserTokens(userId: string): Promise<void>;
  revokeSession(sessionId: string): Promise<void>;
  getUserSessions(userId: string): any[];
}

export interface SessionConfig {
  secret: string;
  expiresIn: string | number;
  refreshExpiresIn: string | number;
  algorithm?: string;
}

// Re-export the interface from auth utilities for backward compatibility
export { JWTSessionManager as SessionManager } from '../middleware/auth.middleware/auth-utilities';
