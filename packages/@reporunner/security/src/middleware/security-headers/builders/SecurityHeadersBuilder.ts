import { Response } from 'express';

export interface SecurityHeadersBuilderConfig {
  frameProtection?: {
    enabled?: boolean;
    action?: 'DENY' | 'SAMEORIGIN';
  };
  contentTypeOptions?: {
    enabled?: boolean;
    nosniff?: boolean;
  };
  xssProtection?: {
    enabled?: boolean;
    mode?: '0' | '1' | '1; mode=block' | '1; report=<reporting-uri>';
  };
  referrerPolicy?: {
    enabled?: boolean;
    policy?: string;
  };
  permissionsPolicy?: {
    enabled?: boolean;
    features?: Record<string, string[]>;
  };
}

export class SecurityHeadersBuilder {
  private config: SecurityHeadersBuilderConfig;

  constructor(config?: SecurityHeadersBuilderConfig) {
    this.config = config || {};
  }

  /**
   * Apply all configured headers to response
   */
  public applyHeaders(res: Response): void {
    this.applyFrameProtection(res);
    this.applyContentTypeOptions(res);
    this.applyXSSProtection(res);
    this.applyReferrerPolicy(res);
    this.applyPermissionsPolicy(res);
  }

  /**
   * Apply frame protection header (X-Frame-Options)
   */
  private applyFrameProtection(res: Response): void {
    const { frameProtection } = this.config;
    if (frameProtection?.enabled) {
      res.setHeader('X-Frame-Options', frameProtection.action || 'DENY');
    }
  }

  /**
   * Apply content type options header (X-Content-Type-Options)
   */
  private applyContentTypeOptions(res: Response): void {
    const { contentTypeOptions } = this.config;
    if (contentTypeOptions?.enabled && contentTypeOptions.nosniff) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
  }

  /**
   * Apply XSS protection header (X-XSS-Protection)
   */
  private applyXSSProtection(res: Response): void {
    const { xssProtection } = this.config;
    if (xssProtection?.enabled) {
      res.setHeader('X-XSS-Protection', xssProtection.mode || '1; mode=block');
    }
  }

  /**
   * Apply referrer policy header (Referrer-Policy)
   */
  private applyReferrerPolicy(res: Response): void {
    const { referrerPolicy } = this.config;
    if (referrerPolicy?.enabled && referrerPolicy.policy) {
      res.setHeader('Referrer-Policy', referrerPolicy.policy);
    }
  }

  /**
   * Apply permissions policy header (Permissions-Policy)
   */
  private applyPermissionsPolicy(res: Response): void {
    const { permissionsPolicy } = this.config;
    if (permissionsPolicy?.enabled && permissionsPolicy.features) {
      const parts: string[] = [];

      for (const [feature, values] of Object.entries(permissionsPolicy.features)) {
        if (values && values.length > 0) {
          parts.push(`${feature}=(${values.join(' ')})`);
        } else {
          parts.push(`${feature}=()`);
        }
      }

      if (parts.length > 0) {
        res.setHeader('Permissions-Policy', parts.join(', '));
      }
    }
  }

  /**
   * Set default security headers
   */
  public setDefaults(): this {
    this.config = {
      frameProtection: {
        enabled: true,
        action: 'DENY'
      },
      contentTypeOptions: {
        enabled: true,
        nosniff: true
      },
      xssProtection: {
        enabled: true,
        mode: '1; mode=block'
      },
      referrerPolicy: {
        enabled: true,
        policy: 'strict-origin-when-cross-origin'
      },
      permissionsPolicy: {
        enabled: true,
        features: {
          geolocation: ["'self'"],
          microphone: ["'none'"],
          camera: ["'none'"],
          payment: ["'self'"],
          usb: ["'none'"]
        }
      }
    };
    return this;
  }

  /**
   * Set development headers (less strict)
   */
  public setDevelopment(): this {
    this.config = {
      frameProtection: {
        enabled: true,
        action: 'SAMEORIGIN'
      },
      contentTypeOptions: {
        enabled: true,
        nosniff: true
      },
      xssProtection: {
        enabled: true,
        mode: '1; mode=block'
      },
      referrerPolicy: {
        enabled: true,
        policy: 'no-referrer-when-downgrade'
      },
      permissionsPolicy: {
        enabled: false
      }
    };
    return this;
  }

  /**
   * Set production headers (strict)
   */
  public setProduction(): this {
    return this.setDefaults();
  }
}