# @reporunner/security

Advanced security utilities for the Reporunner platform, including encryption, rate limiting, and DDoS protection.

## Features

### 🔐 Encryption Service

- **AES-256-GCM encryption** with authenticated encryption
- **Stream encryption** for large files
- **Key derivation** using scrypt
- **Deterministic encryption** for searchable encrypted fields
- **Field-level encryption/decryption** for complex objects
- **Password hashing** with bcrypt
- **HMAC generation** for data integrity

### 🚦 Rate Limiting

- **Redis-backed rate limiting** for distributed systems
- **Memory fallback** when Redis is unavailable
- **DDoS protection** with automatic detection and mitigation
- **Tiered rate limiting** based on user subscription levels
- **Multiple rate limit types** (API, login, execution, upload, etc.)
- **Customizable key generators** (IP, user, API key, combined)
- **Blacklist/whitelist support**
- **Rate limit headers** in responses
- **Metrics and monitoring**

## Installation

```bash
pnpm add @reporunner/security
```

## Usage

### Encryption

```typescript
import { EncryptionService } from "@reporunner/security";

// Initialize the service
const encryptionService = new EncryptionService({
  masterKey: process.env.MASTER_KEY, // 32-byte key
  rotationEnabled: true,
  rotationInterval: 90 * 24 * 60 * 60 * 1000, // 90 days
});

// Encrypt data
const encrypted = await encryptionService.encrypt("sensitive data");
console.log(encrypted); // { ciphertext: '...', iv: '...', salt: '...', authTag: '...' }

// Decrypt data
const decrypted = await encryptionService.decrypt(encrypted);
console.log(decrypted); // 'sensitive data'

// Hash passwords
const hashedPassword = await encryptionService.hashPassword("userPassword123");
const isValid = await encryptionService.verifyPassword(
  "userPassword123",
  hashedPassword,
);

// Field-level encryption
const user = {
  email: "user@example.com",
  ssn: "123-45-6789",
  creditCard: "4111-1111-1111-1111",
};

const encryptedUser = await encryptionService.encryptFields(user, [
  "ssn",
  "creditCard",
]);
// { email: 'user@example.com', ssn: '{encrypted}...', creditCard: '{encrypted}...' }

const decryptedUser = await encryptionService.decryptFields(encryptedUser, [
  "ssn",
  "creditCard",
]);
// Original user object
```

### Rate Limiting

```typescript
import {
  AdvancedRateLimiter,
  createApiRateLimiter,
  createLoginRateLimiter,
} from "@reporunner/security";
import express from "express";

const app = express();

// Initialize rate limiter
const rateLimiter = new AdvancedRateLimiter({
  redis: {
    host: "localhost",
    port: 6379,
    password: "optional",
  },
  useMemoryFallback: true,
  enableDDoSProtection: true,
});

// Apply global API rate limiting
app.use("/api", createApiRateLimiter(rateLimiter));

// Apply login rate limiting
app.post("/auth/login", createLoginRateLimiter(rateLimiter), (req, res) => {
  // Login logic
});

// Custom rate limiter
import { createRateLimitMiddleware } from "@reporunner/security";

const customLimiter = createRateLimitMiddleware(rateLimiter, {
  type: "custom",
  points: 10, // 10 requests
  duration: 60, // per minute
  blockDuration: 300, // block for 5 minutes
  message: "Too many requests",
  keyGenerator: (req) => req.user?.id || req.ip,
});

app.use("/api/resource", customLimiter);
```

### Tiered Rate Limiting

```typescript
import { createTieredRateLimiter } from "@reporunner/security";

// Different limits based on user tier
app.use(
  "/api",
  createTieredRateLimiter(rateLimiter, {
    free: 10, // 10 req/min
    basic: 50, // 50 req/min
    pro: 200, // 200 req/min
    enterprise: 1000, // 1000 req/min
  }),
);
```

### DDoS Protection

```typescript
// DDoS protection is automatically enabled
const rateLimiter = new AdvancedRateLimiter({
  enableDDoSProtection: true,
});

// Monitor metrics
const metrics = rateLimiter.getMetrics();
console.log("Blocked requests:", metrics.blockedCount);
console.log("Suspicious IPs:", metrics.suspiciousIPs);

// Manual blacklisting
await rateLimiter.addToBlacklist("malicious.ip", 86400); // 24 hour ban

// Whitelisting trusted IPs
rateLimiter.addToWhitelist("trusted.internal.ip");
```

## Rate Limiter Types

### Pre-configured Limiters

| Type             | Points | Duration | Block Duration | Use Case                |
| ---------------- | ------ | -------- | -------------- | ----------------------- |
| `api`            | 100    | 60s      | 5 min          | General API requests    |
| `auth`           | 5      | 15 min   | 1 hour         | Authentication attempts |
| `login`          | 3      | 15 min   | 2 hours        | Login attempts          |
| `password-reset` | 2      | 1 hour   | 24 hours       | Password reset requests |
| `execution`      | 10     | 60s      | 10 min         | Workflow executions     |
| `api-key`        | 5      | 24 hours | 24 hours       | API key generation      |
| `upload`         | 10     | 1 hour   | 1 hour         | File uploads            |
| `webhook`        | 1000   | 60s      | 60s            | Webhook calls           |
| `export`         | 5      | 1 hour   | 1 hour         | Data exports            |
| `ddos`           | 1000   | 1s       | 24 hours       | DDoS protection         |

### Custom Limiters

```typescript
// Create custom limiter
rateLimiter.createLimiter("ai-generation", {
  points: 5, // 5 requests
  duration: 3600, // per hour
  blockDuration: 7200, // block for 2 hours
});

// Use custom limiter
app.post(
  "/ai/generate",
  createRateLimitMiddleware(rateLimiter, {
    type: "ai-generation",
    points: 1,
    message: "AI generation limit exceeded",
  }),
  handler,
);
```

## Key Generators

```typescript
import {
  userKeyGenerator, // Based on user ID
  apiKeyGenerator, // Based on API key
  combinedKeyGenerator, // User ID + IP
  endpointKeyGenerator, // IP + endpoint
} from "@reporunner/security";

// Use different key generators
const limiter = createRateLimitMiddleware(rateLimiter, {
  keyGenerator: userKeyGenerator, // Rate limit per user
});
```

## Response Headers

When rate limiting is applied, the following headers are included:

- `X-RateLimit-Limit`: Maximum number of requests
- `X-RateLimit-Remaining`: Number of remaining requests
- `X-RateLimit-Reset`: Time when the limit resets
- `Retry-After`: When to retry (only on 429 responses)

## Monitoring and Management

```typescript
// Get current metrics
const metrics = rateLimiter.getMetrics();

// Check consumption
const consumption = await rateLimiter.getCurrentConsumption("api", "user:123");
console.log(
  `Used ${consumption.consumed} of ${consumption.consumed + consumption.remaining}`,
);

// Reset limits
await rateLimiter.resetLimit("api", "user:123");

// Manage blacklist
await rateLimiter.removeFromBlacklist("ip.address");
```

## Environment Variables

```env
# Encryption
MASTER_KEY=your-32-byte-encryption-key
ENCRYPTION_ROTATION_ENABLED=true
ENCRYPTION_ROTATION_INTERVAL=7776000000  # 90 days in ms

# Redis (for rate limiting)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional-password

# Rate Limiting
RATE_LIMIT_MEMORY_FALLBACK=true
ENABLE_DDOS_PROTECTION=true
```

## Best Practices

### Encryption

1. **Store the master key securely** (use environment variables or secret management)
2. **Enable key rotation** for long-lived systems
3. **Use deterministic encryption** sparingly (only for searchable fields)
4. **Always hash passwords** - never encrypt them
5. **Use stream encryption** for large files

### Rate Limiting

1. **Use Redis in production** for distributed rate limiting
2. **Enable memory fallback** to handle Redis failures
3. **Whitelist internal services** to prevent self-throttling
4. **Monitor metrics** to detect attack patterns
5. **Use appropriate key generators** (user-based for authenticated routes)
6. **Set reasonable limits** based on your application's needs
7. **Implement tiered limits** for different user types

## Security Considerations

- **Master key management**: Use a secure key management system (AWS KMS, HashiCorp Vault, etc.)
- **Redis security**: Use authentication and TLS for Redis connections
- **IP spoofing**: Be cautious with IP-based rate limiting behind proxies
- **DDoS mitigation**: Enable DDoS protection and monitor attack patterns
- **Graceful degradation**: Ensure the application works even if rate limiting fails

## License

MIT
