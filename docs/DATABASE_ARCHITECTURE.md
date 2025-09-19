# Hybrid Database Architecture for Reporunner

This document outlines the hybrid database strategy combining MongoDB and PostgreSQL to create an optimal foundation for enterprise workflow automation with AI capabilities.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│                 Database Service Layer                      │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │    MongoDB Client   │    │   PostgreSQL Client        │ │
│  │   (Primary Data)    │    │   (AI & Analytics)         │ │
│  └─────────────────────┘    └─────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │      MongoDB        │    │   PostgreSQL + pgvector    │ │
│  │   (Self-hosted)     │    │     (Self-hosted)          │ │
│  └─────────────────────┘    └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Database Responsibilities

### MongoDB (Primary Database)

**Purpose**: Flexible document storage for core workflow platform data

**Data Types**:

- **Workflows**: Complete workflow definitions with nodes and edges
- **Executions**: Workflow execution history and status
- **Users**: User accounts, profiles, and settings
- **Organizations**: Multi-tenant organization data
- **Credentials**: Encrypted API keys and OAuth tokens
- **Integrations**: Available integrations and configurations
- **Nodes**: Custom node definitions and metadata
- **Collaboration**: Real-time collaboration sessions and data

**Advantages**:

- Schema flexibility for evolving workflow structures
- Fast reads/writes for workflow operations
- Native JSON support for complex nested data
- Horizontal scaling with sharding
- Change streams for real-time updates

### PostgreSQL with pgvector (AI Database)

**Purpose**: Structured data storage with vector search capabilities

**Data Types**:

- **Embeddings**: Vector representations for semantic search
- **Knowledge Base**: AI knowledge articles and documentation
- **AI Conversations**: Chat history and agent interactions
- **Analytics**: Performance metrics and usage statistics
- **Vector Indexes**: Optimized indexes for similarity search
- **ML Models**: Model metadata and training data

**Advantages**:

- Superior performance for structured queries
- ACID compliance for critical AI data
- pgvector extension for efficient vector operations
- Advanced indexing capabilities
- SQL analytics and reporting

## Database Service Layer

```typescript
// Database abstraction layer
interface DatabaseService {
  // MongoDB operations
  mongo: {
    workflows: WorkflowRepository;
    users: UserRepository;
    executions: ExecutionRepository;
    organizations: OrganizationRepository;
  };

  // PostgreSQL operations
  postgres: {
    embeddings: EmbeddingRepository;
    knowledgeBase: KnowledgeRepository;
    analytics: AnalyticsRepository;
    aiConversations: ConversationRepository;
  };
}

// Smart routing based on data type
class DatabaseRouter {
  async saveWorkflow(workflow: Workflow) {
    return this.mongo.workflows.save(workflow);
  }

  async searchSemantic(query: string) {
    const embedding = await this.generateEmbedding(query);
    return this.postgres.embeddings.findSimilar(embedding);
  }

  async getAnalytics(filters: AnalyticsFilters) {
    return this.postgres.analytics.query(filters);
  }
}
```

## Self-Hosted Deployment

### Docker Compose Configuration

```yaml
version: "3.8"
services:
  # MongoDB (Primary Database)
  mongodb:
    image: mongo:7
    container_name: reporunner-mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: reporunner
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
      MONGO_INITDB_DATABASE: reporunner
    networks:
      - reporunner-network

  # PostgreSQL with pgvector (AI Database)
  postgres:
    image: pgvector/pgvector:pg16
    container_name: reporunner-postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    environment:
      POSTGRES_DB: reporunner_ai
      POSTGRES_USER: reporunner
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    networks:
      - reporunner-network

  # Redis (Caching & Queues)
  redis:
    image: redis:7-alpine
    container_name: reporunner-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - reporunner-network

volumes:
  mongodb_data:
  postgres_data:
  redis_data:

networks:
  reporunner-network:
    driver: bridge
```

### Database Initialization

```sql
-- PostgreSQL initialization script
-- /init-scripts/01-setup-pgvector.sql

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create embeddings table
CREATE TABLE embeddings (
  id SERIAL PRIMARY KEY,
  content_id VARCHAR(255) NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 dimension
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create vector index for similarity search
CREATE INDEX ON embeddings USING ivfflat (embedding vector_cosine_ops);

-- Create knowledge base table
CREATE TABLE knowledge_base (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  tags TEXT[],
  embedding_id INTEGER REFERENCES embeddings(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create AI conversations table
CREATE TABLE ai_conversations (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  workflow_id VARCHAR(255),
  session_id VARCHAR(255) NOT NULL,
  message_type VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create analytics table
CREATE TABLE analytics (
  id SERIAL PRIMARY KEY,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL,
  dimensions JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_embeddings_content ON embeddings(content_id, content_type);
CREATE INDEX idx_knowledge_category ON knowledge_base(category);
CREATE INDEX idx_conversations_session ON ai_conversations(session_id);
CREATE INDEX idx_conversations_user ON ai_conversations(user_id);
CREATE INDEX idx_analytics_metric ON analytics(metric_name, timestamp);
```

## Data Flow Patterns

### Workflow Operations (MongoDB)

```typescript
// Create workflow
const workflow = await mongoService.workflows.create({
  name: "Customer Onboarding",
  nodes: [...],
  edges: [...],
  organizationId: "org_123"
});

// Execute workflow
const execution = await mongoService.executions.create({
  workflowId: workflow.id,
  status: "running",
  startedAt: new Date()
});
```

### AI Operations (PostgreSQL)

```typescript
// Store embedding for semantic search
const embedding = await openai.embeddings.create({
  input: "How to set up email automation",
  model: "text-embedding-ada-002",
});

await postgresService.embeddings.create({
  contentId: "kb_article_123",
  contentType: "knowledge_base",
  embedding: embedding.data[0].embedding,
  metadata: { category: "tutorials" },
});

// Semantic search
const similar = await postgresService.embeddings.findSimilar(queryEmbedding, {
  limit: 5,
  threshold: 0.8,
});
```

## Migration Strategy

### Phase 1: Preparation

1. **Setup PostgreSQL**: Deploy pgvector-enabled PostgreSQL
2. **Database Service Layer**: Create abstraction layer
3. **Dual Write**: Write new AI data to PostgreSQL

### Phase 2: AI Features

1. **Embeddings**: Migrate existing AI data to PostgreSQL
2. **Knowledge Base**: Build semantic search features
3. **Analytics**: Move analytics queries to PostgreSQL

### Phase 3: Optimization

1. **Data Archiving**: Move old execution data to PostgreSQL
2. **Query Optimization**: Optimize cross-database queries
3. **Performance Tuning**: Fine-tune both databases

### Phase 4: Advanced Features

1. **Cross-database Joins**: Implement efficient join strategies
2. **Data Synchronization**: Real-time sync for related data
3. **Backup Strategy**: Unified backup and recovery

## Performance Considerations

### MongoDB Optimization

- **Indexing**: Strategic indexes for workflow queries
- **Sharding**: Horizontal scaling by organization
- **Aggregation**: Efficient pipeline operations
- **Change Streams**: Real-time updates

### PostgreSQL Optimization

- **Vector Indexes**: Optimized ivfflat indexes for similarity search
- **Partitioning**: Time-based partitioning for analytics
- **Connection Pooling**: Efficient connection management
- **Query Optimization**: Proper indexing for complex queries

### Cross-Database Queries

- **Caching**: Redis layer for frequently accessed data
- **Data Denormalization**: Strategic duplication for performance
- **Async Processing**: Background jobs for expensive operations
- **API Design**: Minimize cross-database operations

## Monitoring and Maintenance

### Health Checks

```typescript
// Database health monitoring
class DatabaseHealthService {
  async checkMongoDB() {
    const result = await this.mongo.admin().ping();
    return { status: "healthy", latency: result.latency };
  }

  async checkPostgreSQL() {
    const result = await this.postgres.query("SELECT 1");
    return { status: "healthy", queryTime: result.duration };
  }

  async checkVectorSearch() {
    const testVector = new Array(1536).fill(0);
    const result = await this.postgres.embeddings.findSimilar(testVector, {
      limit: 1,
    });
    return { status: "healthy", searchTime: result.duration };
  }
}
```

### Backup Strategy

- **MongoDB**: Regular snapshots with point-in-time recovery
- **PostgreSQL**: Continuous archiving with WAL-E
- **Cross-backup Consistency**: Coordinated backup timing
- **Disaster Recovery**: Automated failover procedures

## Benefits Summary

### Technical Benefits

- **Optimal Performance**: Each database optimized for its data type
- **Scalability**: Independent scaling of workflow and AI data
- **Flexibility**: Schema flexibility where needed, structure where required
- **Advanced Features**: Vector search and complex analytics

### Business Benefits

- **Cost Effective**: Self-hosted deployment, no cloud vendor lock-in
- **Data Sovereignty**: Full control over sensitive workflow data
- **Compliance**: Easier compliance with data protection regulations
- **Innovation**: Foundation for advanced AI and analytics features

This hybrid approach provides the foundation for Reporunner's enterprise scaling while maintaining flexibility and control over the technology stack.
