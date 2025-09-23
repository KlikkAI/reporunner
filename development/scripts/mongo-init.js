// MongoDB initialization script for development
// This script sets up the development database with initial data

db = db.getSiblingDB('reporunner_dev');

// Create collections
db.createCollection('users');
db.createCollection('workflows');
db.createCollection('executions');
db.createCollection('credentials');
db.createCollection('organizations');

// Create indexes for performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: 1 });
db.workflows.createIndex({ userId: 1 });
db.workflows.createIndex({ organizationId: 1 });
db.workflows.createIndex({ name: 1 });
db.workflows.createIndex({ tags: 1 });
db.executions.createIndex({ workflowId: 1 });
db.executions.createIndex({ status: 1 });
db.executions.createIndex({ startedAt: -1 });
db.credentials.createIndex({ userId: 1 });
db.credentials.createIndex({ type: 1 });

// Insert development user
db.users.insertOne({
  _id: ObjectId(),
  email: 'dev@reporunner.local',
  name: 'Development User',
  password: '$2b$10$K7L1OJ45/4Y2nIvL0RMZOeXY8g8r1WjL4YzJlSGGBzGJl3xX9vI.m', // 'password123'
  role: 'admin',
  isEmailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Insert sample organization
db.organizations.insertOne({
  _id: ObjectId(),
  name: 'Development Organization',
  slug: 'dev-org',
  plan: 'enterprise',
  settings: {
    allowSignup: true,
    maxUsers: 100,
    maxWorkflows: 1000,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
});

print('✅ MongoDB development database initialized successfully');
print('📧 Development user: dev@reporunner.local');
print('🔑 Password: password123');
