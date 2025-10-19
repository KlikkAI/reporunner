-- ============================================
-- PostgreSQL Initialization Script
-- Reporunner - Workflow Automation Platform
-- ============================================

-- This script runs automatically when PostgreSQL container starts for the first time
-- It enables extensions, creates tables, indexes, and functions

\echo '========================================';
\echo 'Reporunner PostgreSQL Initialization';
\echo '========================================';

-- ============================================
-- Enable Required Extensions
-- ============================================

\echo 'Enabling PostgreSQL extensions...';

-- Enable pgvector for AI/ML embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable pg_stat_statements for performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Enable uuid-ossp for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

\echo 'Extensions enabled successfully!';

-- ============================================
-- AI/ML Tables (pgvector)
-- ============================================

\echo 'Creating AI/ML tables...';

-- Embeddings table for vector search
CREATE TABLE IF NOT EXISTS embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id VARCHAR(255),
    node_id VARCHAR(255),
    content TEXT NOT NULL,
    embedding vector(1536),  -- OpenAI ada-002 dimension
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Knowledge base for AI features
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    embedding vector(1536),
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI conversations history
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    workflow_id VARCHAR(255),
    messages JSONB NOT NULL DEFAULT '[]',
    context JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

\echo 'AI/ML tables created successfully!';

-- ============================================
-- Analytics Tables
-- ============================================

\echo 'Creating analytics tables...';

-- Analytics events for tracking
CREATE TABLE IF NOT EXISTS analytics_events (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id VARCHAR(255),
    workflow_id VARCHAR(255),
    execution_id VARCHAR(255),
    node_id VARCHAR(255),
    properties JSONB DEFAULT '{}',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(255),
    ip_address INET
);

-- Workflow statistics (aggregated)
CREATE TABLE IF NOT EXISTS workflow_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id VARCHAR(255) NOT NULL UNIQUE,
    total_executions BIGINT DEFAULT 0,
    successful_executions BIGINT DEFAULT 0,
    failed_executions BIGINT DEFAULT 0,
    avg_execution_time_ms INTEGER,
    last_execution_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User activity metrics
CREATE TABLE IF NOT EXISTS user_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    workflows_created INTEGER DEFAULT 0,
    executions_triggered INTEGER DEFAULT 0,
    active_time_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

\echo 'Analytics tables created successfully!';

-- ============================================
-- Performance Monitoring Tables
-- ============================================

\echo 'Creating performance monitoring tables...';

-- Node execution metrics
CREATE TABLE IF NOT EXISTS node_execution_metrics (
    id BIGSERIAL PRIMARY KEY,
    workflow_id VARCHAR(255) NOT NULL,
    execution_id VARCHAR(255) NOT NULL,
    node_id VARCHAR(255) NOT NULL,
    node_type VARCHAR(100) NOT NULL,
    started_at TIMESTAMP NOT NULL,
    finished_at TIMESTAMP,
    duration_ms INTEGER,
    status VARCHAR(50),
    error_message TEXT,
    memory_used_mb INTEGER,
    cpu_time_ms INTEGER,
    metadata JSONB DEFAULT '{}'
);

-- API request metrics
CREATE TABLE IF NOT EXISTS api_metrics (
    id BIGSERIAL PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER NOT NULL,
    user_id VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER
);

\echo 'Performance monitoring tables created successfully!';

-- ============================================
-- Create Indexes for Performance
-- ============================================

\echo 'Creating indexes...';

-- Embeddings indexes (HNSW for fast vector search)
CREATE INDEX IF NOT EXISTS embeddings_vector_idx ON embeddings
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS embeddings_workflow_idx ON embeddings (workflow_id);
CREATE INDEX IF NOT EXISTS embeddings_node_idx ON embeddings (node_id);
CREATE INDEX IF NOT EXISTS embeddings_created_idx ON embeddings (created_at DESC);

-- Knowledge base indexes
CREATE INDEX IF NOT EXISTS knowledge_base_vector_idx ON knowledge_base
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS knowledge_base_category_idx ON knowledge_base (category);
CREATE INDEX IF NOT EXISTS knowledge_base_tags_idx ON knowledge_base USING GIN (tags);
CREATE INDEX IF NOT EXISTS knowledge_base_title_idx ON knowledge_base USING GIN (to_tsvector('english', title));

-- AI conversations indexes
CREATE INDEX IF NOT EXISTS ai_conversations_user_idx ON ai_conversations (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_conversations_workflow_idx ON ai_conversations (workflow_id);

-- Analytics events indexes
CREATE INDEX IF NOT EXISTS analytics_events_type_idx ON analytics_events (event_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS analytics_events_user_idx ON analytics_events (user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS analytics_events_workflow_idx ON analytics_events (workflow_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS analytics_events_timestamp_idx ON analytics_events (timestamp DESC);

-- Workflow statistics indexes
CREATE INDEX IF NOT EXISTS workflow_statistics_workflow_idx ON workflow_statistics (workflow_id);
CREATE INDEX IF NOT EXISTS workflow_statistics_last_execution_idx ON workflow_statistics (last_execution_at DESC);

-- User metrics indexes
CREATE INDEX IF NOT EXISTS user_metrics_user_date_idx ON user_metrics (user_id, date DESC);
CREATE INDEX IF NOT EXISTS user_metrics_date_idx ON user_metrics (date DESC);

-- Node execution metrics indexes
CREATE INDEX IF NOT EXISTS node_metrics_workflow_idx ON node_execution_metrics (workflow_id, started_at DESC);
CREATE INDEX IF NOT EXISTS node_metrics_execution_idx ON node_execution_metrics (execution_id);
CREATE INDEX IF NOT EXISTS node_metrics_node_type_idx ON node_execution_metrics (node_type, started_at DESC);
CREATE INDEX IF NOT EXISTS node_metrics_status_idx ON node_execution_metrics (status, started_at DESC);

-- API metrics indexes
CREATE INDEX IF NOT EXISTS api_metrics_endpoint_idx ON api_metrics (endpoint, timestamp DESC);
CREATE INDEX IF NOT EXISTS api_metrics_user_idx ON api_metrics (user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS api_metrics_timestamp_idx ON api_metrics (timestamp DESC);
CREATE INDEX IF NOT EXISTS api_metrics_status_idx ON api_metrics (status_code, timestamp DESC);

\echo 'Indexes created successfully!';

-- ============================================
-- Create Functions and Triggers
-- ============================================

\echo 'Creating functions and triggers...';

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
CREATE TRIGGER update_embeddings_updated_at BEFORE UPDATE ON embeddings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON knowledge_base
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON ai_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_statistics_updated_at BEFORE UPDATE ON workflow_statistics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function for similarity search (helper)
CREATE OR REPLACE FUNCTION match_embeddings(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    workflow_id VARCHAR(255),
    node_id VARCHAR(255),
    content TEXT,
    similarity float
)
LANGUAGE SQL STABLE
AS $$
    SELECT
        id,
        workflow_id,
        node_id,
        content,
        1 - (embedding <=> query_embedding) AS similarity
    FROM embeddings
    WHERE 1 - (embedding <=> query_embedding) > match_threshold
    ORDER BY embedding <=> query_embedding
    LIMIT match_count;
$$;

\echo 'Functions and triggers created successfully!';

-- ============================================
-- Grant Permissions
-- ============================================

\echo 'Granting permissions...';

-- Grant all privileges to the postgres user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO postgres;

\echo 'Permissions granted successfully!';

-- ============================================
-- Insert Sample Data (Development Only)
-- ============================================

-- Check if we're in development mode
DO $$
BEGIN
    IF current_setting('server.environment', true) = 'development' THEN
        RAISE NOTICE 'Development mode: Inserting sample data...';

        -- Sample embedding (zero vector for demo)
        INSERT INTO embeddings (workflow_id, node_id, content, embedding) VALUES
        ('demo-workflow-1', 'node-1', 'This is a sample workflow node that processes data',
         array_fill(0.0, ARRAY[1536])::vector);

        -- Sample knowledge base entry
        INSERT INTO knowledge_base (title, content, category, embedding) VALUES
        ('Getting Started with Reporunner',
         'Reporunner is a workflow automation platform that helps you build and execute workflows easily.',
         'tutorial',
         array_fill(0.0, ARRAY[1536])::vector);

        -- Sample analytics event
        INSERT INTO analytics_events (event_type, user_id, workflow_id, properties) VALUES
        ('workflow_created', 'demo-user-1', 'demo-workflow-1', '{"source": "ui"}');

        -- Sample workflow statistics
        INSERT INTO workflow_statistics (workflow_id, total_executions, successful_executions) VALUES
        ('demo-workflow-1', 0, 0);

        RAISE NOTICE 'Sample data inserted!';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Not in development mode or sample data insertion failed';
END $$;

-- ============================================
-- Database Statistics
-- ============================================

\echo '';
\echo '========================================';
\echo 'PostgreSQL initialization complete!';
\echo '========================================';
\echo 'Database: reporunner';

-- Count tables
SELECT 'Tables created: ' || count(*)::text
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- List all tables
\echo 'Tables:';
SELECT '  - ' || table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

\echo '========================================';
