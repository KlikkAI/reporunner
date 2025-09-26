export type PermissionsPolicyFeature =
  | 'accelerometer'
  | 'ambient-light-sensor'
  | 'autoplay'
  | 'battery'
  | 'camera'
  | 'display-capture'
  | 'document-domain'
  | 'encrypted-media'
  | 'execution-while-not-rendered'
  | 'execution-while-out-of-viewport'
  | 'fullscreen'
  | 'geolocation'
  | 'gyroscope'
  | 'magnetometer'
  | 'microphone'
  | 'midi'
  | 'navigation-override'
  | 'payment'
  | 'picture-in-picture'
  | 'publickey-credentials-get'
  | 'screen-wake-lock'
  | 'sync-xhr'
  | 'usb'
  | 'web-share'
  | 'xr-spatial-tracking';

export type PermissionsPolicyValue = '*' | 'self' | `https://${string}` | 'none';

export interface PermissionsPolicyConfig {
  enabled?: boolean;
  features?: Partial<Record<PermissionsPolicyFeature, PermissionsPolicyValue[]>>;
}

export class PermissionsPolicyBuilder {
  private config: Required<PermissionsPolicyConfig>;

  constructor(config: PermissionsPolicyConfig = {}) {
    this.config = {
      enabled: true,
      features: {},
      ...config
    };
  }

  /**
   * Add a feature to the policy
   */
  public addFeature(
    feature: PermissionsPolicyFeature,
    values: PermissionsPolicyValue[]
  ): this {
    this.validateFeatureValues(values);
    this.config.features[feature] = values;
    return this;
  }

  /**
   * Remove a feature from the policy
   */
  public removeFeature(feature: PermissionsPolicyFeature): this {
    delete this.config.features[feature];
    return this;
  }

  /**
   * Get all features
   */
  public getFeatures(): Readonly<Record<string, PermissionsPolicyValue[]>> {
    return { ...this.config.features };
  }

  /**
   * Build the Permissions-Policy header value
   */
  public build(): string {
    return Object.entries(this.config.features)
      .map(([feature, values]) => this.formatFeaturePolicy(feature, values))
      .join(', ');
  }

  /**
   * Validate feature values
   */
  private validateFeatureValues(values: PermissionsPolicyValue[]): void {
    for (const value of values) {
      if (
        value !== '*' &&
        value !== 'self' &&
        value !== 'none' &&
        !value.startsWith('https://')
      ) {
        throw new Error(
          `Invalid permission policy value: ${value}. Must be '*', 'self', 'none', or an https:// origin`
        );
      }
    }
  }

  /**
   * Format a single feature policy
   */
  private formatFeaturePolicy(
    feature: string,
    values: PermissionsPolicyValue[]
  ): string {
    if (values.length === 0 || values.includes('none')) {
      return `${feature}=()`; // Empty allowlist
    }

    const formattedValues = values.map(value => {
      if (value === '*') return '*';
      if (value === 'self') return '"self"';
      return `"${value}"`; // For URLs
    });

    return `${feature}=(${formattedValues.join(' ')})`;
  }

  /**
   * Create a new builder with secure defaults
   */
  public static withSecureDefaults(): PermissionsPolicyBuilder {
    return new PermissionsPolicyBuilder({
      enabled: true,
      features: {
        accelerometer: ['none'],
        'ambient-light-sensor': ['none'],
        autoplay: ['none'],
        battery: ['none'],
        camera: ['none'],
        'display-capture': ['none'],
        'document-domain': ['none'],
        'encrypted-media': ['none'],
        'execution-while-not-rendered': ['none'],
        'execution-while-out-of-viewport': ['none'],
        fullscreen: ['self'],
        geolocation: ['none'],
        gyroscope: ['none'],
        magnetometer: ['none'],
        microphone: ['none'],
        midi: ['none'],
        'navigation-override': ['none'],
        payment: ['self'],
        'picture-in-picture': ['none'],
        'publickey-credentials-get': ['self'],
        'screen-wake-lock': ['none'],
        'sync-xhr': ['none'],
        usb: ['none'],
        'web-share': ['none'],
        'xr-spatial-tracking': ['none']
      }
    });
  }

  /**
   * Create a new builder with development defaults (less strict)
   */
  public static withDevDefaults(): PermissionsPolicyBuilder {
    return new PermissionsPolicyBuilder({
      enabled: true,
      features: {
        camera: ['self'],
        fullscreen: ['self'],
        geolocation: ['self'],
        microphone: ['self'],
        payment: ['self'],
        'publickey-credentials-get': ['self']
      }
    });
  }

  /**
   * Create a new builder from a Permissions-Policy string
   */
  public static fromString(policy: string): PermissionsPolicyBuilder {
    const features: Record<string, PermissionsPolicyValue[]> = {};

    policy.split(',').forEach(directive => {
      const [feature, valueList] = directive.trim().split('=');
      if (!feature || !valueList) return;

      // Extract values from parentheses and split
      const values = valueList
        .slice(1, -1) // Remove ()
        .split(' ')
        .map(v => v.trim())
        .filter(Boolean)
        .map(v => {
          if (v === '*') return v as PermissionsPolicyValue;
          if (v === '"self"') return 'self' as PermissionsPolicyValue;
          // Remove quotes from URLs
          return v.replace(/^"|"$/g, '') as PermissionsPolicyValue;
        });

      features[feature] = values;
    });

    return new PermissionsPolicyBuilder({ features });
  }
}