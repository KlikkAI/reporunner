/**
 * Shared Validation Schemas
 * Centralized validation schemas for API requests and responses
 * Consolidated from @reporunner/validation and existing shared validation
 */

import { z } from 'zod';

export * from '../types/audit';
export * from '../types/schedules';
// Re-export all validation schemas from types
export * from '../types/security';
export * from '../types/triggers';

// Export validation middleware
export * from './middleware';

// ============================================================================
// COMMON VALIDATION SCHEMAS
// ============================================================================

// Base schemas for common fields
export const IdSchema = z.string().min(1, 'ID is required');
export const OptionalIdSchema = z.string().optional();
export const EmailSchema = z.string().email('Invalid email format');
export const UrlSchema = z.string().url('Invalid URL format');
export const IpAddressSchema = z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, 'Invalid IP address');
export const DateTimeSchema = z.string().datetime('Invalid datetime format');
export const OptionalDateTimeSchema = z.string().datetime().optional();

// Pagination schemas
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const PaginationResponseSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

// Search schemas
export const SearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  fields: z.array(z.string()).optional(),
  filters: z.record(z.string(), z.any()).optional(),
});

// Organization and user schemas
export const OrganizationIdSchema = z.string().min(1, 'Organization ID is required');
export const UserIdSchema = z.string().min(1, 'User ID is required');
export const OptionalOrganizationIdSchema = z.string().optional();
export const OptionalUserIdSchema = z.string().optional();

// Metadata schema
export const MetadataSchema = z.record(z.string(), z.any()).optional();

// Tags schema
export const TagsSchema = z.array(z.string()).optional();

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

// Standard API response wrapper
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
    timestamp: z.string().datetime().optional(),
  });

// Paginated response wrapper
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    success: z.boolean(),
    data: z.array(itemSchema),
    pagination: PaginationResponseSchema,
    error: z.string().optional(),
    message: z.string().optional(),
    timestamp: z.string().datetime().optional(),
  });

// Error response schema
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string().optional(),
  code: z.string().optional(),
  details: z.record(z.string(), z.any()).optional(),
  timestamp: z.string().datetime().optional(),
});

// ============================================================================
// BULK OPERATION SCHEMAS
// ============================================================================

export const BulkOperationSchema = z.object({
  operation: z.enum(['create', 'update', 'delete']),
  items: z.array(z.record(z.string(), z.any())).min(1).max(100),
  options: z
    .object({
      continueOnError: z.boolean().default(false),
      validateOnly: z.boolean().default(false),
    })
    .optional(),
});

export const BulkOperationResultSchema = z.object({
  success: z.boolean(),
  totalItems: z.number(),
  successCount: z.number(),
  errorCount: z.number(),
  results: z.array(
    z.object({
      index: z.number(),
      success: z.boolean(),
      data: z.any().optional(),
      error: z.string().optional(),
    })
  ),
  errors: z
    .array(
      z.object({
        index: z.number(),
        error: z.string(),
        item: z.any(),
      })
    )
    .optional(),
});

// ============================================================================
// FILE UPLOAD SCHEMAS
// ============================================================================

export const FileUploadSchema = z.object({
  filename: z.string().min(1),
  mimetype: z.string().min(1),
  size: z
    .number()
    .min(1)
    .max(50 * 1024 * 1024), // 50MB max
  encoding: z.string().optional(),
  metadata: MetadataSchema,
});

export const FileUploadResponseSchema = z.object({
  success: z.boolean(),
  fileId: z.string(),
  filename: z.string(),
  size: z.number(),
  url: z.string().url(),
  expiresAt: DateTimeSchema.optional(),
  metadata: MetadataSchema,
});

// ============================================================================
// WEBHOOK SCHEMAS
// ============================================================================

export const WebhookEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  timestamp: DateTimeSchema,
  source: z.string(),
  data: z.record(z.string(), z.any()),
  signature: z.string().optional(),
  retryCount: z.number().default(0),
});

export const WebhookDeliverySchema = z.object({
  id: z.string(),
  webhookId: z.string(),
  eventId: z.string(),
  url: z.string().url(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  headers: z.record(z.string(), z.string()),
  payload: z.record(z.string(), z.any()),
  status: z.enum(['pending', 'delivered', 'failed', 'retrying']),
  attempts: z.number(),
  lastAttemptAt: DateTimeSchema.optional(),
  nextRetryAt: DateTimeSchema.optional(),
  response: z
    .object({
      statusCode: z.number(),
      headers: z.record(z.string(), z.string()),
      body: z.string(),
    })
    .optional(),
  error: z.string().optional(),
});

// ============================================================================
// HEALTH CHECK SCHEMAS
// ============================================================================

export const HealthCheckSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: DateTimeSchema,
  version: z.string(),
  uptime: z.number(),
  services: z.record(z.string(),
    z.object({
      status: z.enum(['operational', 'degraded', 'down']),
      responseTime: z.number().optional(),
      lastCheck: DateTimeSchema.optional(),
      error: z.string().optional(),
    })
  ),
  metrics: z
    .object({
      cpu: z.number().optional(),
      memory: z.number().optional(),
      disk: z.number().optional(),
      connections: z.number().optional(),
    })
    .optional(),
});

// ============================================================================
// CONFIGURATION SCHEMAS
// ============================================================================

export const ConfigurationSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
  type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
  description: z.string().optional(),
  category: z.string().optional(),
  sensitive: z.boolean().default(false),
  required: z.boolean().default(false),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
      enum: z.array(z.any()).optional(),
    })
    .optional(),
});

// ============================================================================
// NOTIFICATION SCHEMAS
// ============================================================================

export const NotificationSchema = z.object({
  id: z.string(),
  type: z.enum(['info', 'success', 'warning', 'error']),
  title: z.string(),
  message: z.string(),
  timestamp: DateTimeSchema,
  userId: OptionalUserIdSchema,
  organizationId: OptionalOrganizationIdSchema,
  read: z.boolean().default(false),
  readAt: OptionalDateTimeSchema,
  actions: z
    .array(
      z.object({
        label: z.string(),
        action: z.string(),
        url: z.string().url().optional(),
        style: z.enum(['primary', 'secondary', 'danger']).optional(),
      })
    )
    .optional(),
  metadata: MetadataSchema,
});

// ============================================================================
// RATE LIMITING SCHEMAS
// ============================================================================

export const RateLimitSchema = z.object({
  limit: z.number().min(1),
  window: z.number().min(1), // in seconds
  remaining: z.number().min(0),
  resetAt: DateTimeSchema,
  retryAfter: z.number().optional(),
});

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Create a schema for array of items with validation
 */
export function createArraySchema<T extends z.ZodTypeAny>(
  itemSchema: T,
  options: {
    minItems?: number;
    maxItems?: number;
    unique?: boolean;
  } = {}
) {
  let schema = z.array(itemSchema);

  if (options.minItems !== undefined) {
    schema = schema.min(options.minItems);
  }

  if (options.maxItems !== undefined) {
    schema = schema.max(options.maxItems);
  }

  return schema;
}

/**
 * Create a partial schema for update operations
 */
export function createUpdateSchema<T extends z.ZodRawShape>(baseSchema: z.ZodObject<T>) {
  return baseSchema.partial();
}

/**
 * Create a query schema with common filters
 */
export function createQuerySchema(
  specificFilters: z.ZodObject<any>,
  options: {
    includePagination?: boolean;
    includeSearch?: boolean;
    includeSorting?: boolean;
  } = {}
) {
  let schema = specificFilters;

  if (options.includePagination) {
    schema = schema.merge(PaginationQuerySchema) as any;
  }

  if (options.includeSearch) {
    schema = schema.merge(SearchQuerySchema.partial()) as any;
  }

  return schema;
}

/**
 * Validate and transform date strings
 */
export const dateTransform = z.string().transform((str) => new Date(str));

/**
 * Validate and transform numeric strings
 */
export const numericTransform = z.string().transform((str) => Number(str));

/**
 * Validate and transform boolean strings
 */
export const booleanTransform = z.string().transform((str) => str === 'true');

/**
 * Create enum schema from array of values
 */
export function createEnumSchema<T extends readonly [string, ...string[]]>(values: T) {
  return z.enum(values);
}

/**
 * Create conditional schema based on discriminator
 */
export function createConditionalSchema<T extends string>(
  discriminator: T,
  schemas: Record<string, z.ZodTypeAny>
) {
  return z.discriminatedUnion(discriminator as any, Object.values(schemas) as any);
}
