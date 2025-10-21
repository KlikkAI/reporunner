# @klikkflow/core

**Centralized utilities and base classes for the KlikkFlow platform.**

This package provides battle-tested utilities that should be used across all KlikkFlow packages. By using these shared utilities, we eliminate code duplication, ensure consistent behavior, and reduce maintenance burden.

## 📦 Installation

```bash
pnpm add @klikkflow/core
```

## 🎯 Purpose

- **Eliminate Duplication**: Stop reimplementing error handling, logging, and validation
- **Consistent Behavior**: Same error handling patterns across all packages
- **Battle-Tested**: Utilities used in production
- **Type-Safe**: Full TypeScript support
- **Well-Documented**: Clear examples and usage patterns

## 🛠️ Core Utilities

### Error Handler

Centralized error handling with retry logic and exponential backoff.

**Features:**
- Automatic retry with exponential backoff
- Customizable max retries
- Stack trace control
- Logger integration
- Async/sync operation support

```typescript
import { ErrorHandler } from '@klikkflow/core';

const errorHandler = new ErrorHandler({
  enableStackTrace: true,
  maxRetries: 3
});

// Handle sync errors
try {
  riskyOperation();
} catch (error) {
  errorHandler.handle(error, 'Operation context');
}

// Handle async operations with automatic retry
const result = await errorHandler.handleAsync(
  async () => {
    return await fetchDataFromAPI();
  },
  'Fetching data from API',
  3 // max retries
);

// Wrap functions for automatic error handling
const wrappedFunction = errorHandler.wrapAsync(
  async (id: string) => {
    return await database.findById(id);
  },
  'Database query'
);

const user = await wrappedFunction('user-123');
```

**Why use this instead of custom error handling?**
- ✅ Exponential backoff is tricky to implement correctly
- ✅ Consistent error logging across all packages
- ✅ Configurable retry behavior
- ✅ Less boilerplate code

### Logger

Structured logging with multiple log levels and custom handlers.

**Features:**
- Multiple log levels (debug, info, warn, error)
- Service-specific loggers with context
- Custom log handlers
- Child loggers for sub-contexts
- Console and custom output support

```typescript
import { Logger } from '@klikkflow/core';

// Create a logger for your service
const logger = new Logger('MyService', {
  minLevel: 'info',
  enableConsole: true
});

// Basic logging
logger.debug('Debugging information', { userId: '123' });
logger.info('User logged in', { userId: '123', timestamp: Date.now() });
logger.warn('API rate limit approaching', { remaining: 10 });
logger.error('Database connection failed', new Error('Connection timeout'));

// Create child logger for sub-context
const dbLogger = logger.child('Database');
dbLogger.info('Query executed', { query: 'SELECT * FROM users', time: 45 });

// Add custom log handler (e.g., send to external service)
logger.addHandler((entry) => {
  if (entry.level === 'error') {
    sendToSentry(entry);
  }
});
```

**Why use this instead of console.log?**
- ✅ Structured logs with timestamps and context
- ✅ Filterable by log level
- ✅ Easy to send logs to external services
- ✅ Production-ready logging
- ✅ No more scattered console.log statements

### Validator

Comprehensive validation with fluent API.

**Features:**
- Fluent validation API
- Built-in validators (email, URL, patterns)
- Custom validation functions
- Schema validation for objects
- Detailed error messages

```typescript
import { Validator, SchemaValidator } from '@klikkflow/core';

// Simple field validation
const emailValidator = new Validator<string>()
  .required('Email is required')
  .string('Must be a string')
  .email('Invalid email format');

try {
  await emailValidator.validate('user@example.com', 'email');
  console.log('Valid email!');
} catch (error) {
  console.error(error.message);
}

// Number validation
const ageValidator = new Validator<number>()
  .required()
  .number()
  .min(18, 'Must be at least 18')
  .max(120, 'Must be at most 120');

await ageValidator.validate(25, 'age');

// String validation with pattern
const usernameValidator = new Validator<string>()
  .required()
  .string()
  .minLength(3, 'Username must be at least 3 characters')
  .maxLength(20, 'Username must be at most 20 characters')
  .pattern(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

// URL validation
const urlValidator = new Validator<string>()
  .required()
  .url('Invalid URL format');

await urlValidator.validate('https://example.com', 'webhookUrl');

// Custom validation
const passwordValidator = new Validator<string>()
  .required()
  .string()
  .minLength(8)
  .custom(
    (value) => /[A-Z]/.test(value),
    'Password must contain at least one uppercase letter'
  )
  .custom(
    (value) => /[0-9]/.test(value),
    'Password must contain at least one number'
  );

// Schema validation for objects
const userSchema = new SchemaValidator({
  email: {
    type: 'string',
    required: true,
    validator: emailValidator
  },
  age: {
    type: 'number',
    required: true,
    validator: ageValidator
  },
  username: {
    type: 'string',
    required: true,
    validator: usernameValidator
  }
});

const userData = {
  email: 'user@example.com',
  age: 25,
  username: 'john_doe'
};

try {
  await userSchema.validate(userData);
  console.log('Valid user data!');
} catch (error) {
  console.error('Validation errors:', error.details);
}
```

**Why use this instead of manual validation?**
- ✅ Fluent, readable validation code
- ✅ Reusable validators across your app
- ✅ Comprehensive built-in validators
- ✅ Consistent error messages
- ✅ No more scattered if/else validation logic

## 📦 Package Contents

```
@klikkflow/core/
├── src/
│   ├── base/             # Base classes for services and repositories
│   ├── cache/            # Caching utilities
│   ├── decorators/       # TypeScript decorators
│   ├── errors/           # Custom error classes
│   ├── events/           # Event emitter and handling
│   ├── interfaces/       # Core interfaces
│   ├── middleware/       # Express middleware
│   ├── repository/       # Repository pattern implementations
│   ├── service/          # Base service classes
│   ├── types/            # Core type definitions
│   ├── use-cases/        # Use case base classes
│   ├── utils/            # ⭐ Core utilities (ErrorHandler, Logger, Validator)
│   └── validation/       # Validation utilities
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Quick Start

### 1. Install the Package

```bash
pnpm add @klikkflow/core
```

### 2. Import and Use

```typescript
import {
  ErrorHandler,
  Logger,
  Validator
} from '@klikkflow/core';

// Set up logger
const logger = new Logger('MyService');

// Set up error handler with logger
const errorHandler = new ErrorHandler({ logger });

// Set up validators
const emailValidator = new Validator<string>()
  .required()
  .email();
```

### 3. Replace Custom Implementations

**Before:**
```typescript
// ❌ Custom error handling (duplicated across packages)
try {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed');
  return response.json();
} catch (error) {
  console.error('Error:', error);
  // Manual retry logic here...
  throw error;
}

// ❌ Custom logging (inconsistent formats)
console.log(`[${new Date().toISOString()}] INFO: User logged in`);

// ❌ Custom validation (scattered logic)
if (!email || !email.includes('@')) {
  throw new Error('Invalid email');
}
```

**After:**
```typescript
// ✅ Using @klikkflow/core
import { ErrorHandler, Logger, Validator } from '@klikkflow/core';

const errorHandler = new ErrorHandler();
const logger = new Logger('AuthService');
const emailValidator = new Validator<string>().required().email();

// Automatic retry with exponential backoff
const data = await errorHandler.handleAsync(
  async () => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed');
    return response.json();
  },
  'Fetching user data'
);

// Structured logging
logger.info('User logged in', { userId, timestamp: Date.now() });

// Clean validation
await emailValidator.validate(email, 'email');
```

## 📖 Best Practices

### 1. Create Package-Level Instances

```typescript
// services/logger.ts
import { Logger } from '@klikkflow/core';

export const logger = new Logger('MyPackage', {
  minLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
});

// Use throughout your package
import { logger } from './services/logger';
logger.info('Something happened');
```

### 2. Combine Utilities

```typescript
import { ErrorHandler, Logger } from '@klikkflow/core';

const logger = new Logger('APIService');
const errorHandler = new ErrorHandler({
  logger,
  maxRetries: 3
});

// ErrorHandler will use the logger automatically
await errorHandler.handleAsync(
  () => callExternalAPI(),
  'External API call'
);
```

### 3. Create Reusable Validators

```typescript
// validators/common.ts
import { Validator } from '@klikkflow/core';

export const validators = {
  email: new Validator<string>().required().email(),
  url: new Validator<string>().required().url(),
  positiveNumber: new Validator<number>().required().number().min(0),
  username: new Validator<string>()
    .required()
    .string()
    .minLength(3)
    .maxLength(20)
    .pattern(/^[a-zA-Z0-9_]+$/, 'Invalid username format')
};

// Use throughout your package
import { validators } from './validators/common';
await validators.email.validate(userEmail, 'email');
```

## 🔄 Migration Guide

See [MIGRATION_GUIDE.md](../../../docs/MIGRATION_GUIDE.md) for detailed instructions on migrating from custom implementations to `@klikkflow/core` utilities.

## 🤝 Contributing

When you find yourself writing utility code, ask:

1. **Is this already in @klikkflow/core?** Check first!
2. **Should this be in @klikkflow/core?** If it's useful across packages, yes!
3. **Is this package-specific?** Then keep it in your package.

If you add new utilities to this package:
- Add comprehensive documentation
- Include usage examples
- Write tests
- Update this README

## 📄 License

MIT License - See root LICENSE file

---

**Stop duplicating code. Use @klikkflow/core.**