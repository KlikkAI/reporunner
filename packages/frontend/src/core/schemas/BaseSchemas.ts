import { z } from 'zod'

// Common utility schemas
export const TimestampSchema = z.string().datetime()
export const IdSchema = z.string().min(1)
export const OptionalIdSchema = z.string().optional()

// Common status enums
export const StatusSchema = z.enum([
  'active',
  'inactive',
  'draft',
  'error',
  'expired',
] as const)
export const ExecutionStatusSchema = z.enum([
  'pending',
  'running',
  'success',
  'completed',
  'error', 
  'failed',
  'cancelled',
  'timeout',
] as const)
export const LogLevelSchema = z.enum([
  'debug',
  'info',
  'warn',
  'error',
] as const)

// API Response wrapper schemas
export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    message: z.string().optional(),
    errors: z.array(z.string()).optional(),
    meta: z.record(z.string(), z.unknown()).optional(),
  })

export const ApiErrorSchema = z.object({
  success: z.literal(false as const),
  message: z.string(),
  errors: z.array(z.string()).optional(),
  code: z.string().optional(),
  status: z.number().optional(),
})

// Pagination schemas
export const PaginationParamsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc'] as const).default('desc'),
})

export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().min(0),
    limit: z.number().int().min(1),
    offset: z.number().int().min(0),
    hasMore: z.boolean(),
  })

// Node parameter types - safe alternatives to 'any'
export const NodeParameterValueSchema: z.ZodSchema<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(NodeParameterValueSchema),
    z.record(z.string(), NodeParameterValueSchema),
  ])
)

export const NodeParametersSchema = z.record(z.string(), NodeParameterValueSchema)

// Common metadata schema
export const MetadataSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.any()])
)

// Type inference helpers
export type ApiResponse<T> = z.infer<
  ReturnType<typeof ApiResponseSchema<z.ZodType<T>>>
>
export type ApiError = z.infer<typeof ApiErrorSchema>
export type PaginationParams = z.infer<typeof PaginationParamsSchema>
export type PaginatedResponse<T> = z.infer<
  ReturnType<typeof PaginatedResponseSchema<z.ZodType<T>>>
>
export type NodeParameterValue = z.infer<typeof NodeParameterValueSchema>
export type NodeParameters = z.infer<typeof NodeParametersSchema>
export type Metadata = z.infer<typeof MetadataSchema>
