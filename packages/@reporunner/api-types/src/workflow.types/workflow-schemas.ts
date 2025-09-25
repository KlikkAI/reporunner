meta: z.record(z.string(), z.any()).optional(),
})

export type Node = z.infer<typeof NodeSchema>;
export type Edge = z.infer<typeof EdgeSchema>;
export type Workflow = z.infer<typeof WorkflowSchema>;
