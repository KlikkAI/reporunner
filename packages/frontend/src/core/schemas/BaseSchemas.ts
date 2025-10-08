import { z } from 'zod';

// Common field schemas
export const IdSchema = z.string().min(1);
export const MetadataSchema = z.record(z.string(), z.unknown());
export const NodeParametersSchema = z.record(z.string(), z.unknown());
export const StatusSchema = z.enum(['active', 'inactive', 'expired', 'pending', 'error']);

// Base schemas for common data structures
export const BaseResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  timestamp: z.string(),
});

export const ErrorResponseSchema = BaseResponseSchema.extend({
  success: z.literal(false),
  error: z.string(),
  details: z.any().optional(),
});

export const SuccessResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  data: z.any().optional(),
});

/**
 * Generic API response wrapper function
 * Wraps a data schema with success/error response structure
 */
export function ApiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.union([
    SuccessResponseSchema.extend({
      data: dataSchema,
    }),
    ErrorResponseSchema,
  ]);
}

export const OptionalIdSchema = IdSchema.optional();

export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  total: z.number().min(0),
  pages: z.number().min(0),
});

// Pagination query parameters (for API requests)
export const PaginationParamsSchema = z.object({
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

/**
 * Generic paginated response wrapper function
 * Wraps an items schema with pagination metadata
 */
export function PaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    pagination: PaginationSchema,
  });
}

export const IdParamSchema = z.object({
  id: z.string().min(1),
});

// Individual timestamp field (ISO datetime string)
export const TimestampSchema = z.string().datetime();

// Object with created/updated timestamps
export const TimestampsSchema = z.object({
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const UserReferenceSchema = z.object({
  userId: z.string(),
  organizationId: z.string().optional(),
});

// Additional field validation schemas
export const EmailSchema = z.string().email();
export const UrlSchema = z.string().url();
export const UuidSchema = z.string().uuid();

// Export types
export type BaseResponse = z.infer<typeof BaseResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type PaginationParams = z.infer<typeof PaginationParamsSchema>;
export type PaginatedResponse<T = unknown> = {
  items: T[];
  pagination: Pagination;
  // Convenience properties for direct access
  total?: number;
  page?: number;
  limit?: number;
};
export type IdParam = z.infer<typeof IdParamSchema>;
export type Timestamp = z.infer<typeof TimestampSchema>;
export type Timestamps = z.infer<typeof TimestampsSchema>;
export type UserReference = z.infer<typeof UserReferenceSchema>;
export type Metadata = z.infer<typeof MetadataSchema>;
export type NodeParameters = z.infer<typeof NodeParametersSchema>;
export type Status = z.infer<typeof StatusSchema>;

// Alias exports for backward compatibility
export type ApiError = ErrorResponse;
export type ApiResponse<T = any> = SuccessResponse & { data?: T };
