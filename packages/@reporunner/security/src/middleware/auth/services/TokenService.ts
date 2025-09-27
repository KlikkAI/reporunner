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
  constructor(config: {
    secret: string;
    expiresIn: string | number;
    refreshExpiresIn: string | number;
  }) {
    // TODO: Store config for actual JWT implementation
    console.log('TokenService initialized with config:', config);
  }

  async generateToken(payload: TokenPayload): Promise<string> {
    // TODO: Implement JWT generation
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      // TODO: Implement JWT verification
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      return payload;
    } catch (error) {
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

  async revokeToken(token: string): Promise<void> {
    // TODO: Implement token revocation
    console.log('Token revoked:', token);
  }
}

// Export as default and named export for compatibility
export default JWTTokenService;
export { JWTTokenService as TokenService, TokenServiceInterface };