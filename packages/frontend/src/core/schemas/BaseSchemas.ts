import { z } from 'zod';

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

export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  total: z.number().min(0),
  pages: z.number().min(0),
});

export const PaginatedResponseSchema = SuccessResponseSchema.extend({
  data: z.object({
    items: z.array(z.any()),
    pagination: PaginationSchema,
  }),
});

export const IdParamSchema = z.object({
  id: z.string().min(1),
});

export const TimestampSchema = z.object({
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const UserReferenceSchema = z.object({
  userId: z.string(),
  organizationId: z.string().optional(),
});

// Common field schemas
export const EmailSchema = z.string().email();
export const UrlSchema = z.string().url();
export const UuidSchema = z.string().uuid();

// Export types
export type BaseResponse = z.infer<typeof BaseResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type PaginatedResponse = z.infer<typeof PaginatedResponseSchema>;
export type IdParam = z.infer<typeof IdParamSchema>;
export type Timestamp = z.infer<typeof TimestampSchema>;
export type UserReference = z.infer<typeof UserReferenceSchema>;
