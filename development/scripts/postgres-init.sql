-- PostgreSQL initialization script for development
-- This script sets up the development database with pgvector extension

-- Create the database if it doesn't exist
SELECT 'CREATE DATABASE reporunner_dev'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'reporunner_dev');

-- Connect to the development database
\c reporunner_dev;

-- Enable pgvector extension for AI features
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS ai;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Create embeddings table for AI features
CREATE TABLE IF NOT EXISTS ai.embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI embedding dimension
  metadata JSONB,
  source_type VARCHAR(50),
  source_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for vector similarity search
CREATE INDEX IF NOT EXISTS embeddings_embedding_idx ON ai.embeddings
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS embeddings_source_idx ON ai.embeddings (source_type, source_id);
CREATE INDEX IF NOT EXISTS embeddings_created_at_idx ON ai.embeddings (created_at);

-- Create knowledge base table
CREATE TABLE IF NOT EXISTS ai.knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  tags TEXT[],
  category VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AI conversations table
CREATE TABLE IF NOT EXISTS ai.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL,
  workflow_id VARCHAR(255),
  messages JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics tables
CREATE TABLE IF NOT EXISTS analytics.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL,
  user_id VARCHAR(255),
  organization_id VARCHAR(255),
  workflow_id VARCHAR(255),
  execution_id VARCHAR(255),
  properties JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for analytics
CREATE INDEX IF NOT EXISTS events_event_type_idx ON analytics.events (event_type);
CREATE INDEX IF NOT EXISTS events_user_id_idx ON analytics.events (user_id);
CREATE INDEX IF NOT EXISTS events_timestamp_idx ON analytics.events (timestamp);
CREATE INDEX IF NOT EXISTS events_workflow_id_idx ON analytics.events (workflow_id);

-- Create performance metrics table
CREATE TABLE IF NOT EXISTS analytics.performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC NOT NULL,
  tags JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user for the application
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'reporunner_app') THEN
    CREATE ROLE reporunner_app WITH LOGIN PASSWORD 'dev_password';
  END IF;
END
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA ai TO reporunner_app;
GRANT USAGE ON SCHEMA analytics TO reporunner_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ai TO reporunner_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA analytics TO reporunner_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ai TO reporunner_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA analytics TO reporunner_app;

-- Insert sample data for development
INSERT INTO ai.knowledge_base (title, content, summary, tags, category) VALUES
('Getting Started with Reporunner', 'Reporunner is a powerful workflow automation platform...', 'Introduction to Reporunner platform', ARRAY['tutorial', 'basics'], 'documentation'),
('Email Integration Guide', 'Learn how to integrate Gmail and other email providers...', 'Email integration tutorial', ARRAY['email', 'gmail', 'integration'], 'tutorials'),
('AI Features Overview', 'Explore the AI capabilities of Reporunner including...', 'AI features documentation', ARRAY['ai', 'features', 'automation'], 'documentation');

-- Sample analytics events
INSERT INTO analytics.events (event_type, user_id, properties) VALUES
('user_login', 'dev-user-123', '{"ip": "127.0.0.1", "user_agent": "Mozilla/5.0"}'),
('workflow_created', 'dev-user-123', '{"workflow_name": "Sample Workflow", "node_count": 3}'),
('workflow_executed', 'dev-user-123', '{"workflow_id": "sample-workflow-123", "duration": 1500}');

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_embeddings_updated_at BEFORE UPDATE ON ai.embeddings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON ai.knowledge_base
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON ai.conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Print success message
DO $$
BEGIN
  RAISE NOTICE '✅ PostgreSQL development database initialized successfully';
  RAISE NOTICE '🤖 pgvector extension enabled for AI features';
  RAISE NOTICE '📊 Analytics tables created';
  RAISE NOTICE '🔑 Application user: reporunner_app';
END $$;