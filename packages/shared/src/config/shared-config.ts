// Shared Configuration Utilities
export const createBaseConfig = (packageName: string) => ({
  name: packageName,
  version: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/klikkflow',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'default-secret',
    jwtExpiration: '24h',
    bcryptRounds: 12,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
  },
});

export const createServiceConfig = (serviceName: string, specificConfig: any = {}) => ({
  ...createBaseConfig(serviceName),
  service: {
    name: serviceName,
    ...specificConfig,
  },
});

export const createMiddlewareConfig = (middlewareName: string) => ({
  name: middlewareName,
  enabled: true,
  options: {},
});

// Common validation schemas
export const commonValidationRules = {
  email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  password: { required: true, minLength: 8 },
  id: { required: true, pattern: /^[a-fA-F0-9]{24}$/ },
};

// Common error messages
export const commonErrorMessages = {
  VALIDATION_FAILED: 'Validation failed',
  UNAUTHORIZED: 'Unauthorized access',
  NOT_FOUND: 'Resource not found',
  INTERNAL_ERROR: 'Internal server error',
  DUPLICATE_ENTRY: 'Duplicate entry',
};

// Common response formats
export const createResponse = (success: boolean, data?: any, message?: string, error?: any) => ({
  success,
  data,
  message,
  error,
  timestamp: new Date().toISOString(),
});
