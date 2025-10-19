// ============================================
// MongoDB Initialization Script
// Reporunner - Workflow Automation Platform
// ============================================

// This script runs automatically when MongoDB container starts for the first time
// It creates the database, collections, indexes, and users

print('========================================');
print('Reporunner MongoDB Initialization');
print('========================================');

// Switch to reporunner database
db = db.getSiblingDB('reporunner');

print('Creating collections...');

// ============================================
// Create Collections
// ============================================

// Workflows - Store workflow definitions
db.createCollection('workflows', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'userId', 'nodes', 'edges'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'Workflow name is required',
        },
        description: {
          bsonType: 'string',
        },
        userId: {
          bsonType: 'string',
          description: 'User ID is required',
        },
        organizationId: {
          bsonType: 'string',
        },
        nodes: {
          bsonType: 'array',
          description: 'Workflow nodes',
        },
        edges: {
          bsonType: 'array',
          description: 'Workflow edges/connections',
        },
        active: {
          bsonType: 'bool',
        },
        tags: {
          bsonType: 'array',
        },
      },
    },
  },
});

// Executions - Store workflow execution history
db.createCollection('executions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['workflowId', 'status', 'startedAt'],
      properties: {
        workflowId: {
          bsonType: 'string',
          description: 'Workflow ID is required',
        },
        userId: {
          bsonType: 'string',
        },
        status: {
          enum: ['pending', 'running', 'success', 'error', 'cancelled'],
          description: 'Execution status',
        },
        startedAt: {
          bsonType: 'date',
        },
        finishedAt: {
          bsonType: 'date',
        },
        error: {
          bsonType: 'object',
        },
        data: {
          bsonType: 'object',
          description: 'Execution results and node outputs',
        },
      },
    },
  },
});

// Credentials - Store encrypted API credentials
db.createCollection('credentials', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'type', 'userId', 'data'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'Credential name',
        },
        type: {
          bsonType: 'string',
          description: 'Credential type (oauth2, apiKey, etc.)',
        },
        userId: {
          bsonType: 'string',
          description: 'Owner user ID',
        },
        organizationId: {
          bsonType: 'string',
        },
        data: {
          bsonType: 'object',
          description: 'Encrypted credential data',
        },
        verified: {
          bsonType: 'bool',
          description: 'Whether credential has been tested',
        },
      },
    },
  },
});

// Users - Store user accounts
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'passwordHash'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'Valid email required',
        },
        passwordHash: {
          bsonType: 'string',
          description: 'Bcrypt password hash',
        },
        name: {
          bsonType: 'string',
        },
        organizationId: {
          bsonType: 'string',
        },
        role: {
          enum: ['admin', 'user', 'viewer'],
          description: 'User role',
        },
        active: {
          bsonType: 'bool',
        },
      },
    },
  },
});

// Organizations - Multi-tenant support
db.createCollection('organizations', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'Organization name',
        },
        settings: {
          bsonType: 'object',
          description: 'Organization-specific settings',
        },
        plan: {
          enum: ['free', 'starter', 'professional', 'enterprise'],
          description: 'Subscription plan',
        },
      },
    },
  },
});

// Integrations - Available integrations metadata
db.createCollection('integrations');

print('Collections created successfully!');

// ============================================
// Create Indexes for Performance
// ============================================

print('Creating indexes...');

// Workflows indexes
db.workflows.createIndex({ userId: 1, createdAt: -1 });
db.workflows.createIndex({ organizationId: 1 });
db.workflows.createIndex({ active: 1 });
db.workflows.createIndex({ tags: 1 });
db.workflows.createIndex({ name: 'text', description: 'text' });

// Executions indexes
db.executions.createIndex({ workflowId: 1, startedAt: -1 });
db.executions.createIndex({ userId: 1, startedAt: -1 });
db.executions.createIndex({ status: 1, startedAt: -1 });
db.executions.createIndex({ startedAt: -1 });
db.executions.createIndex({ 'data.nodeId': 1 }, { sparse: true });

// Credentials indexes
db.credentials.createIndex({ userId: 1, type: 1 });
db.credentials.createIndex({ organizationId: 1 });
db.credentials.createIndex({ type: 1 });

// Users indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ organizationId: 1 });
db.users.createIndex({ active: 1 });

// Organizations indexes
db.organizations.createIndex({ name: 1 }, { unique: true });
db.organizations.createIndex({ plan: 1 });

print('Indexes created successfully!');

// ============================================
// Create Application User (if running with auth)
// ============================================

// Note: This only works if MongoDB is running with auth enabled
// In development, this might be skipped
try {
  db.createUser({
    user: 'reporunner_app',
    pwd: process.env.MONGO_APP_PASSWORD || 'reporunner_dev_password',
    roles: [
      {
        role: 'readWrite',
        db: 'reporunner',
      },
    ],
  });
  print('Application user created successfully!');
} catch (e) {
  print(`Note: Could not create user (auth may not be enabled): ${e.message}`);
}

// ============================================
// Insert Sample Data (Development Only)
// ============================================

if (process.env.NODE_ENV === 'development') {
  print('Development mode: Inserting sample data...');

  // Sample organization
  const orgId = new ObjectId();
  db.organizations.insertOne({
    _id: orgId,
    name: 'Demo Organization',
    plan: 'free',
    settings: {
      allowedDomains: ['example.com'],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Sample user (password: 'demo123')
  const userId = new ObjectId();
  db.users.insertOne({
    _id: userId,
    email: 'demo@reporunner.com',
    passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYa7W1lkJ/u',
    name: 'Demo User',
    organizationId: orgId.toString(),
    role: 'admin',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Sample workflow
  db.workflows.insertOne({
    name: 'Sample Workflow',
    description: 'A simple example workflow',
    userId: userId.toString(),
    organizationId: orgId.toString(),
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: { label: 'Manual Trigger' },
      },
      {
        id: 'action-1',
        type: 'action',
        position: { x: 300, y: 100 },
        data: { label: 'HTTP Request' },
      },
    ],
    edges: [
      {
        id: 'e1-2',
        source: 'trigger-1',
        target: 'action-1',
      },
    ],
    active: false,
    tags: ['sample', 'demo'],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  print('Sample data inserted!');
}

// ============================================
// Database Statistics
// ============================================

print('');
print('========================================');
print('MongoDB initialization complete!');
print('========================================');
print('Database: reporunner');
print(`Collections created: ${db.getCollectionNames().length}`);
print('');
print('Collections:');
db.getCollectionNames().forEach((collection) => {
  print(`  - ${collection}`);
});
print('========================================');
