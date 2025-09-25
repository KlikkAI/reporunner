export type ExecutionDocument = z.infer<typeof ExecutionDocumentSchema>;
export type UserDocument = z.infer<typeof UserDocumentSchema>;
export type OrganizationDocument = z.infer<typeof OrganizationDocumentSchema>;
export type CredentialDocument = z.infer<typeof CredentialDocumentSchema>;

// PostgreSQL table schemas for AI features
export const EmbeddingTableSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  embedding: z.array(z.number()), // Vector
  metadata: z.record(z.unknown()),
  source: z.string(),
  sourceId: z.string(),
  organizationId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const KnowledgeBaseTableSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  organizationId: z.string(),
  isPublic: z.boolean().default(false),
  settings: z.record(z.unknown()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
});

export const ConversationTableSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string(),
  userId: z.string(),
  organizationId: z.string().optional(),
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string(),
      timestamp: z.date(),
      metadata: z.record(z.unknown()).optional(),
    })
  ),
  summary: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const AnalyticsEventTableSchema = z.object({
  id: z.string().uuid(),
  event: z.string(),
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  workflowId: z.string().optional(),
  executionId: z.string().optional(),
  properties: z.record(z.unknown()).default({}),
  timestamp: z.date(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

// PostgreSQL types
export type EmbeddingTable = z.infer<typeof EmbeddingTableSchema>;
export type KnowledgeBaseTable = z.infer<typeof KnowledgeBaseTableSchema>;
export type ConversationTable = z.infer<typeof ConversationTableSchema>;
export type AnalyticsEventTable = z.infer<typeof AnalyticsEventTableSchema>;

// Query interfaces
export interface QueryOptions {
  limit?: number;
  offset?: number;
  sort?: Record<string, 1 | -1>;
  projection?: Record<string, 1 | 0>;
}

export interface VectorSearchOptions {
  vector: number[];
  limit?: number;
  threshold?: number;
  filter?: Record<string, unknown>;
  includeMetadata?: boolean;
}

export interface VectorSearchResult {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  score: number;
  distance: number;
}

// Repository interfaces
export interface IRepository<T> {
  create(entity: Omit<T, '_id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findOne(filter: Partial<T>): Promise<T | null>;
  findMany(filter: Partial<T>, options?: QueryOptions): Promise<T[]>;
  update(id: string, updates: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  count(filter?: Partial<T>): Promise<number>;
