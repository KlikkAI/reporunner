import { z } from 'zod';

// Workflow schemas
export const WorkflowNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  data: z.record(z.string(), z.any()),
  integrationData: z.object({
    id: z.string(),
    category: z.string(),
    subcategory: z.string().optional()
  }).optional()
});

export const WorkflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional()
});

export const WorkflowDefinitionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Workflow name is required'),
  description: z.string().optional(),
  nodes: z.array(WorkflowNodeSchema),
  edges: z.array(WorkflowEdgeSchema),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Auth schemas
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required')
});

// Credential schemas
export const CredentialSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Credential name is required'),
  type: z.string(),
  data: z.record(z.string(), z.any()),
  createdAt: z.date(),
  updatedAt: z.date()
});

// API response schema
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional()
});

// Environment variable schema
export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  PORT: z.string().transform(Number).optional()
});