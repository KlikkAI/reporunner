import { PermissionsPolicyBuilder, PermissionsPolicyValue } from '../PermissionsPolicyBuilder';

describe('PermissionsPolicyBuilder', () => {
  describe('Basic functionality', () => {
    it('should create empty policy by default', () => {
      const builder = new PermissionsPolicyBuilder();
      expect(builder.build()).toBe('');
    });

    it('should add features correctly', () => {
      const builder = new PermissionsPolicyBuilder();
      builder.addFeature('camera', ['self']);
      expect(builder.build()).toBe('camera=("self")');
    });

    it('should handle multiple features', () => {
      const builder = new PermissionsPolicyBuilder();
      builder
        .addFeature('camera', ['self'])
        .addFeature('microphone', ['none'])
        .addFeature('geolocation', ['https://maps.example.com']);

      const policy = builder.build();
      expect(policy).toContain('camera=("self")');
      expect(policy).toContain('microphone=()');
      expect(policy).toContain('geolocation=("https://maps.example.com")');
    });

    it('should remove features correctly', () => {
      const builder = new PermissionsPolicyBuilder();
      builder
        .addFeature('camera', ['self'])
        .addFeature('microphone', ['none']);

      builder.removeFeature('camera');
      expect(builder.build()).toBe('microphone=()');
    });
  });

  describe('Value validation', () => {
    it('should allow valid values', () => {
      const builder = new PermissionsPolicyBuilder();
      const validValues: PermissionsPolicyValue[] = [
        '*',
        'self',
        'none',
        'https://example.com'
      ];

      expect(() => {
        builder.addFeature('camera', validValues);
      }).not.toThrow();
    });

    it('should reject invalid values', () => {
      const builder = new PermissionsPolicyBuilder();
      const invalidValues = [
        'http://example.com',
        'ftp://example.com',
        'invalid',
        'self*',
        '*self'
      ];

      invalidValues.forEach(value => {
        expect(() => {
          builder.addFeature('camera', [value as PermissionsPolicyValue]);
        }).toThrow('Invalid permission policy value');
      });
    });

    it('should handle empty values list', () => {
      const builder = new PermissionsPolicyBuilder();
      builder.addFeature('camera', []);
      expect(builder.build()).toBe('camera=()');
    });
  });

  describe('Value formatting', () => {
    it('should format wildcard correctly', () => {
      const builder = new PermissionsPolicyBuilder();
      builder.addFeature('camera', ['*']);
      expect(builder.build()).toBe('camera=(*)');
    });

    it('should format self correctly', () => {
      const builder = new PermissionsPolicyBuilder();
      builder.addFeature('camera', ['self']);
      expect(builder.build()).toBe('camera=("self")');
    });

    it('should format none correctly', () => {
      const builder = new PermissionsPolicyBuilder();
      builder.addFeature('camera', ['none']);
      expect(builder.build()).toBe('camera=()');
    });

    it('should format URLs correctly', () => {
      const builder = new PermissionsPolicyBuilder();
      builder.addFeature('camera', ['https://example.com']);
      expect(builder.build()).toBe('camera=("https://example.com")');
    });

    it('should format multiple values correctly', () => {
      const builder = new PermissionsPolicyBuilder();
      builder.addFeature('camera', ['self', 'https://example.com', '*']);
      expect(builder.build()).toBe('camera=("self" "https://example.com" *)');
    });
  });

  describe('Static factory methods', () => {
    describe('withSecureDefaults', () => {
      it('should create secure policy configuration', () => {
        const builder = PermissionsPolicyBuilder.withSecureDefaults();
        const policy = builder.build();

        // Check for restrictive defaults
        expect(policy).toContain('camera=()');
        expect(policy).toContain('microphone=()');
        expect(policy).toContain('geolocation=()');
        expect(policy).toContain('payment=("self")');
      });
    });

    describe('withDevDefaults', () => {
      it('should create development-friendly policy configuration', () => {
        const builder = PermissionsPolicyBuilder.withDevDefaults();
        const policy = builder.build();

        // Check for more permissive defaults
        expect(policy).toContain('camera=("self")');
        expect(policy).toContain('microphone=("self")');
        expect(policy).toContain('geolocation=("self")');
      });
    });

    describe('fromString', () => {
      it('should parse simple policy string', () => {
        const builder = PermissionsPolicyBuilder.fromString('camera=("self")');
        expect(builder.build()).toBe('camera=("self")');
      });

      it('should parse complex policy string', () => {
        const policyString = 'camera=("self"), microphone=(), geolocation=("self" "https://maps.example.com" *)';
        const builder = PermissionsPolicyBuilder.fromString(policyString);
        const policy = builder.build();

        expect(policy).toContain('camera=("self")');
        expect(policy).toContain('microphone=()');
        expect(policy).toContain('geolocation=("self" "https://maps.example.com" *)');
      });

      it('should handle malformed input gracefully', () => {
        const malformedInputs = [
          '',
          'invalid',
          'camera',
          'camera=',
          'camera=()',
          'camera=("self",)'
        ];

        malformedInputs.forEach(input => {
          expect(() => {
            PermissionsPolicyBuilder.fromString(input);
          }).not.toThrow();
        });
      });
    });
  });

  describe('Feature management', () => {
    it('should return current features', () => {
      const builder = new PermissionsPolicyBuilder();
      builder
        .addFeature('camera', ['self'])
        .addFeature('microphone', ['none']);

      const features = builder.getFeatures();
      expect(features).toEqual({
        camera: ['self'],
        microphone: ['none']
      });
    });

    it('should not allow external modification of features', () => {
      const builder = new PermissionsPolicyBuilder();
      builder.addFeature('camera', ['self']);

      const features = builder.getFeatures();
      // @ts-ignore - Testing runtime behavior
      features.camera = ['none'];

      expect(builder.build()).toBe('camera=("self")');
    });

    it('should override existing features', () => {
      const builder = new PermissionsPolicyBuilder();
      builder
        .addFeature('camera', ['self'])
        .addFeature('camera', ['none']);

      expect(builder.build()).toBe('camera=()');
    });
  });
});