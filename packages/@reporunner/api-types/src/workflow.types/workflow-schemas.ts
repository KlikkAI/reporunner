import { z } from 'zod';

// Node Schema
export const NodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.object({
    label: z.string().optional(),
    inputs: z.record(z.string(), z.any()).optional(),
    outputs: z.record(z.string(), z.any()).optional(),
    config: z.record(z.string(), z.any()).optional(),
  }),
  meta: z.record(z.string(), z.any()).optional(),
});

// Edge Schema
export const EdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  data: z.record(z.string(), z.any()).optional(),
  meta: z.record(z.string(), z.any()).optional(),
});

// Workflow Schema
export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
  settings: z.object({
    timezone: z.string().optional(),
    errorWorkflow: z.string().optional(),
    callerPolicy: z.enum(['workflowsFromSameOwner', 'workflowsFromAList', 'any']).optional(),
  }).optional(),
  meta: z.record(z.string(), z.any()).optional(),
})

export type Node = z.infer<typeof NodeSchema>;
export type Edge = z.infer<typeof EdgeSchema>;
export type Workflow = z.infer<typeof WorkflowSchema>;
