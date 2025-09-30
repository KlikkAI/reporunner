export interface CSPConfig {
  enabled?: boolean;
  reportOnly?: boolean;
  directives?: Record<string, string[]>;
  reportUri?: string;
}

export class CSPBuilder {
  private config: CSPConfig;

  constructor(config?: CSPConfig) {
    this.config = config || {
      enabled: true,
      reportOnly: false,
      directives: {},
    };
  }

  /**
   * Build CSP header value
   */
  public build(): string {
    const directives = this.config.directives || {};
    const parts: string[] = [];

    // Add each directive
    for (const [directive, values] of Object.entries(directives)) {
      if (values && values.length > 0) {
        parts.push(`${directive} ${values.join(' ')}`);
      }
    }

    // Add report URI if specified
    if (this.config.reportUri) {
      parts.push(`report-uri ${this.config.reportUri}`);
    }

    return parts.join('; ');
  }

  /**
   * Add a directive
   */
  public addDirective(name: string, ...values: string[]): this {
    if (!this.config.directives) {
      this.config.directives = {};
    }

    if (!this.config.directives[name]) {
      this.config.directives[name] = [];
    }

    this.config.directives[name].push(...values);
    return this;
  }

  /**
   * Set report URI
   */
  public setReportUri(uri: string): this {
    this.config.reportUri = uri;
    return this;
  }

  /**
   * Enable report only mode
   */
  public setReportOnly(reportOnly: boolean = true): this {
    this.config.reportOnly = reportOnly;
    return this;
  }

  /**
   * Set nonce for scripts
   */
  public setNonce(nonce: string): this {
    const nonceDirectives = ['script-src', 'style-src'];

    for (const directive of nonceDirectives) {
      this.addDirective(directive, `'nonce-${nonce}'`);
    }

    return this;
  }

  /**
   * Allow inline scripts
   */
  public allowInlineScripts(): this {
    return this.addDirective('script-src', "'unsafe-inline'");
  }

  /**
   * Allow inline styles
   */
  public allowInlineStyles(): this {
    return this.addDirective('style-src', "'unsafe-inline'");
  }

  /**
   * Allow eval
   */
  public allowEval(): this {
    return this.addDirective('script-src', "'unsafe-eval'");
  }

  /**
   * Set default source
   */
  public setDefaultSrc(...sources: string[]): this {
    this.config.directives = this.config.directives || {};
    this.config.directives['default-src'] = sources;
    return this;
  }

  /**
   * Set script source
   */
  public setScriptSrc(...sources: string[]): this {
    this.config.directives = this.config.directives || {};
    this.config.directives['script-src'] = sources;
    return this;
  }

  /**
   * Set style source
   */
  public setStyleSrc(...sources: string[]): this {
    this.config.directives = this.config.directives || {};
    this.config.directives['style-src'] = sources;
    return this;
  }

  /**
   * Set connect source
   */
  public setConnectSrc(...sources: string[]): this {
    this.config.directives = this.config.directives || {};
    this.config.directives['connect-src'] = sources;
    return this;
  }

  /**
   * Set img source
   */
  public setImgSrc(...sources: string[]): this {
    this.config.directives = this.config.directives || {};
    this.config.directives['img-src'] = sources;
    return this;
  }

  /**
   * Set font source
   */
  public setFontSrc(...sources: string[]): this {
    this.config.directives = this.config.directives || {};
    this.config.directives['font-src'] = sources;
    return this;
  }
}
