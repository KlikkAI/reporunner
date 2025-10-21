import type { Request } from 'express';

interface BasicAuthUser {
  id: string;
  username: string;
  permissions?: string[];
  [key: string]: unknown;
}

// Basic Auth Strategy implementation reusing patterns from security middleware
export interface BasicAuthStrategyOptions {
  validateCredentials: (username: string, password: string) => Promise<BasicAuthUser>;
  realm?: string;
}

export class BasicAuthStrategy {
  private options: BasicAuthStrategyOptions;

  constructor(options: BasicAuthStrategyOptions) {
    this.options = {
      realm: 'KlikkFlow API',
      ...options,
    };
  }

  async authenticate(req: Request): Promise<BasicAuthUser> {
    const credentials = this.extractCredentials(req);

    if (!credentials) {
      throw new Error('Basic auth credentials not provided');
    }

    const { username, password } = credentials;

    // Validate credentials using the provided validator
    return await this.options.validateCredentials(username, password);
  }

  private extractCredentials(req: Request): { username: string; password: string } | null {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Basic ')) {
      return null;
    }

    try {
      const base64Credentials = authHeader.substring(6);
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [username, password] = credentials.split(':');

      if (!(username && password)) {
        return null;
      }

      return { username, password };
    } catch (_error) {
      return null;
    }
  }

  getOptions(): BasicAuthStrategyOptions {
    return this.options;
  }

  getWWWAuthenticateHeader(): string {
    return `Basic realm="${this.options.realm}"`;
  }
}

export function createBasicAuthStrategy(options: BasicAuthStrategyOptions): BasicAuthStrategy {
  return new BasicAuthStrategy(options);
}
