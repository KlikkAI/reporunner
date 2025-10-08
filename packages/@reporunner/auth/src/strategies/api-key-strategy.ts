import type { Request } from 'express';

interface APIKeyUser {
  id: string;
  name?: string;
  permissions?: string[];
  [key: string]: unknown;
}

// API Key Strategy implementation reusing patterns from security middleware
export interface APIKeyStrategyOptions {
  headerName?: string;
  queryName?: string;
  validateKey: (key: string) => Promise<APIKeyUser>;
}

export class APIKeyStrategy {
  private options: APIKeyStrategyOptions;

  constructor(options: APIKeyStrategyOptions) {
    this.options = {
      headerName: 'x-api-key',
      queryName: 'api_key',
      ...options,
    };
  }

  async authenticate(req: Request): Promise<APIKeyUser> {
    // Extract API key from header or query parameter
    const apiKey = this.extractAPIKey(req);

    if (!apiKey) {
      throw new Error('API key not provided');
    }

    // Validate the API key using the provided validator
    return await this.options.validateKey(apiKey);
  }

  private extractAPIKey(req: Request): string | null {
    // Check header first
    if (this.options.headerName && req.headers[this.options.headerName]) {
      return req.headers[this.options.headerName];
    }

    // Check query parameter
    if (this.options.queryName && req.query[this.options.queryName]) {
      return req.query[this.options.queryName];
    }

    return null;
  }

  getOptions(): APIKeyStrategyOptions {
    return this.options;
  }
}

export function createAPIKeyStrategy(options: APIKeyStrategyOptions): APIKeyStrategy {
  return new APIKeyStrategy(options);
}
