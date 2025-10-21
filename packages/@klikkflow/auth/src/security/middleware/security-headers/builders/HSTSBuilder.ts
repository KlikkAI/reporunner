export interface HSTSConfig {
  enabled?: boolean;
  maxAge?: number;
  includeSubDomains?: boolean;
  preload?: boolean;
}

export class HSTSBuilder {
  private config: HSTSConfig;

  constructor(config?: HSTSConfig) {
    this.config = config || {
      enabled: true,
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: false,
    };
  }

  /**
   * Build HSTS header value
   */
  public build(): string {
    const parts: string[] = [];

    // Add max age
    parts.push(`max-age=${this.config.maxAge || 31536000}`);

    // Add includeSubDomains if enabled
    if (this.config.includeSubDomains) {
      parts.push('includeSubDomains');
    }

    // Add preload if enabled
    if (this.config.preload) {
      parts.push('preload');
    }

    return parts.join('; ');
  }

  /**
   * Set max age
   */
  public setMaxAge(seconds: number): this {
    this.config.maxAge = seconds;
    return this;
  }

  /**
   * Enable/disable includeSubDomains
   */
  public setIncludeSubDomains(include: boolean = true): this {
    this.config.includeSubDomains = include;
    return this;
  }

  /**
   * Enable/disable preload
   */
  public setPreload(preload: boolean = true): this {
    this.config.preload = preload;
    return this;
  }

  /**
   * Set to development configuration (short max-age)
   */
  public setDevelopment(): this {
    this.config.maxAge = 60; // 1 minute
    this.config.includeSubDomains = false;
    this.config.preload = false;
    return this;
  }

  /**
   * Set to production configuration (1 year max-age)
   */
  public setProduction(): this {
    this.config.maxAge = 31536000; // 1 year
    this.config.includeSubDomains = true;
    this.config.preload = true;
    return this;
  }
}
