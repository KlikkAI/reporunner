import { AuthenticationError } from '@reporunner/core';

export interface TokenPayload {
  id: string;
  email: string;
  organizationId: string;
  permissions?: string[];
  roles?: string[];
}

interface TokenServiceInterface {
  generateToken(payload: TokenPayload): Promise<string>;
  verifyToken(token: string): Promise<TokenPayload>;
  verifyAndDecode(token: string): Promise<TokenPayload>;
  refreshToken(token: string): Promise<string>;
  revokeToken(token: string): Promise<void>;
}

export class JWTTokenService implements TokenServiceInterface {
  // @ts-ignore - Config stored for future JWT implementation
  private config: any;

  constructor(config?: any) {
    this.config = config;
  }

  async generateToken(payload: TokenPayload): Promise<string> {
    // TODO: Implement JWT generation with config
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      // TODO: Implement JWT verification
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      return payload;
    } catch (_error) {
      throw new AuthenticationError('Invalid token');
    }
  }

  async verifyAndDecode(token: string): Promise<TokenPayload> {
    return this.verifyToken(token);
  }

  async refreshToken(token: string): Promise<string> {
    // TODO: Implement token refresh
    const payload = await this.verifyToken(token);
    return this.generateToken(payload);
  }

  async revokeToken(_token: string): Promise<void> {}
}

// Export as default and named export for compatibility
export default JWTTokenService;
export { JWTTokenService as TokenService, type TokenServiceInterface };
