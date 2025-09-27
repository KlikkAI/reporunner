# Security Headers Middleware

The Security Headers middleware provides a configurable way to add security-related HTTP headers to your application's responses. These headers help protect against various web security vulnerabilities.

## Installation

```bash
pnpm add @reporunner/security
```

## Basic Usage

```typescript
import { SecurityHeadersMiddleware } from '@reporunner/security';

const app = express();

// Use default security headers
const securityHeaders = new SecurityHeadersMiddleware();
app.use(securityHeaders.handle);
```

## Configuration Options

### Content Security Policy (CSP)

Controls which resources can be loaded by the page.

```typescript
const headers = new SecurityHeadersMiddleware({
  csp: {
    enabled: true,
    reportOnly: false,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'", 'data:']
    },
    reportUri: '/csp-report'
  }
});
```

### HTTP Strict Transport Security (HSTS)

Ensures the browser only connects via HTTPS.

```typescript
const headers = new SecurityHeadersMiddleware({
  hsts: {
    enabled: true,
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
});
```

### Frame Protection (X-Frame-Options)

Controls whether the page can be loaded in an iframe.

```typescript
const headers = new SecurityHeadersMiddleware({
  frameOptions: {
    enabled: true,
    action: 'DENY' // or 'SAMEORIGIN'
  }
});
```

### Content Type Options

Prevents MIME type sniffing.

```typescript
const headers = new SecurityHeadersMiddleware({
  contentTypeOptions: {
    enabled: true
  }
});
```

### XSS Protection

Controls the browser's XSS filter.

```typescript
const headers = new SecurityHeadersMiddleware({
  xssProtection: {
    enabled: true,
    mode: '1; mode=block'
  }
});
```

### Referrer Policy

Controls how much referrer information should be included with requests.

```typescript
const headers = new SecurityHeadersMiddleware({
  referrerPolicy: {
    enabled: true,
    policy: 'strict-origin-when-cross-origin'
  }
});
```

### Permissions Policy

Controls which browser features and APIs the site can use.

```typescript
const headers = new SecurityHeadersMiddleware({
  permissionsPolicy: {
    enabled: true,
    features: {
      camera: ['self'],
      microphone: ['none'],
      geolocation: ['https://maps.example.com'],
      payment: ['self']
    }
  }
});
```

## Environment-Specific Configuration

### Development

```typescript
const devHeaders = new SecurityHeadersMiddleware({
  // Less strict CSP for local development
  csp: {
    enabled: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'connect-src': ["'self'", 'http://localhost:*']
    }
  },
  // Disable HSTS in development
  hsts: {
    enabled: false
  }
});
```

### Production

```typescript
const prodHeaders = new SecurityHeadersMiddleware({
  // Strict CSP
  csp: {
    enabled: true,
    directives: {
      'default-src': ["'none'"],
      'script-src': ["'self'"],
      'style-src': ["'self'"],
      'img-src': ["'self'"],
      'connect-src': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': []
    }
  },
  // Enable HSTS
  hsts: {
    enabled: true,
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});
```

## Route-Specific Headers

You can apply different security headers to different routes:

```typescript
// API routes
app.use('/api', new SecurityHeadersMiddleware({
  csp: {
    enabled: true,
    directives: {
      'default-src': ["'none'"],
      'connect-src': ["'self'"]
    }
  }
}).handle);

// Admin routes
app.use('/admin', new SecurityHeadersMiddleware({
  // Strict security for admin pages
  csp: {
    enabled: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'connect-src': ["'self'"]
    }
  },
  frameOptions: {
    enabled: true,
    action: 'DENY'
  }
}).handle);
```

## Dynamic Headers

You can update headers dynamically based on the request:

```typescript
app.use((req, res, next) => {
  const headers = new SecurityHeadersMiddleware({
    csp: {
      enabled: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': [
          "'self'",
          // Add nonce for inline scripts
          `'nonce-${res.locals.nonce}'`
        ]
      }
    }
  });

  return headers.handle(req, res, next);
});
```

## Reporting and Monitoring

Enable CSP reporting to track violations:

```typescript
const headers = new SecurityHeadersMiddleware({
  csp: {
    enabled: true,
    reportOnly: true,
    directives: {
      // Your CSP directives
    },
    reportUri: '/csp-report'
  }
});

// Handle CSP violation reports
app.post('/csp-report',
  express.json({ type: 'application/csp-report' }),
  (req, res) => {
    console.log('CSP Violation:', req.body);
    res.status(204).end();
  }
);
```

## Best Practices

1. **Start Strict**: Begin with strict defaults and loosen only as needed.

2. **Environment-Specific**: Use different configurations for development and production.

3. **Monitor Reports**: Enable CSP reporting to identify legitimate violations.

4. **Regular Updates**: Review and update security headers regularly.

5. **Test Thoroughly**: Verify that security headers don't break functionality.

6. **Gradual Implementation**: For existing applications, consider using `reportOnly` mode first.

## Security Considerations

1. Always enable HSTS in production for HTTPS sites.

2. Avoid `unsafe-inline` and `unsafe-eval` in CSP in production.

3. Use nonces or hashes instead of `unsafe-inline` when inline scripts are necessary.

4. Set strict `frame-ancestors` to prevent clickjacking.

5. Enable `upgrade-insecure-requests` in production.

6. Use strict Permissions Policy to limit feature access.

## Advanced Usage

### Custom Header Builders

You can use the header builders directly for more control:

```typescript
import { CSPBuilder, HSTSBuilder, PermissionsPolicyBuilder } from '@reporunner/security';

// Create a custom CSP
const csp = CSPBuilder.withSecureDefaults()
  .addDirective('script-src', ["'self'", "'nonce-123'"])
  .addDirective('style-src', ["'self'", "'sha256-hash'"]);

// Create a custom HSTS policy
const hsts = HSTSBuilder.withSecureDefaults()
  .setMaxAge(63072000)
  .enablePreload();

// Create a custom Permissions Policy
const permissions = PermissionsPolicyBuilder.withSecureDefaults()
  .addFeature('camera', ['self'])
  .addFeature('microphone', ['none']);
```

### Conditional Security

Apply different security policies based on conditions:

```typescript
app.use((req, res, next) => {
  if (req.secure) {
    // HTTPS request
    return new SecurityHeadersMiddleware({
      hsts: { enabled: true }
    }).handle(req, res, next);
  }
  
  if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
    // AJAX request
    return new SecurityHeadersMiddleware({
      csp: {
        enabled: true,
        directives: {
          'default-src': ["'none'"],
          'connect-src': ["'self'"]
        }
      }
    }).handle(req, res, next);
  }

  // Default headers
  return new SecurityHeadersMiddleware().handle(req, res, next);
});
```

### Error Pages

Set specific headers for error pages:

```typescript
app.use((err, req, res, next) => {
  const errorHeaders = new SecurityHeadersMiddleware({
    csp: {
      enabled: true,
      directives: {
        'default-src': ["'none'"],
        'script-src': ["'self'"],
        'style-src': ["'self'"],
        'img-src': ["'self'"]
      }
    }
  });

  errorHeaders.handle(req, res, () => {
    res.status(500).render('error');
  });
});
```