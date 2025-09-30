type: 'starter', limits;
:
{
  users: 10, workflows;
  : 100,
          executions: 1000
}
,
        features:
{
  sso: false, api;
  : true,
          customDomain: false
}
},
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: 'test-user-id',
      ...overrides
    }
}

  static createWorkflow(overrides?: any)
{
  return {
      id: 'test-workflow-id',
      name: 'Test Workflow',
      description: 'Test workflow description',
      tenantId: 'test-tenant-id',
      nodes: [
        {
          id: 'node1',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: { trigger: 'manual' }
        },
        {
          id: 'node2',
          type: 'action',
          position: { x: 300, y: 100 },
          data: { action: 'send-email' }
        }
      ],
      edges: [
        {
          id: 'edge1',
          source: 'node1',
          target: 'node2'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'test-user-id',
      ...overrides
    };
}

static
createUser(overrides?: any)
{
  return {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin',
      tenantId: 'test-tenant-id',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
}

static
createExecution(overrides?: any)
{
  return {
      id: 'test-execution-id',
      workflowId: 'test-workflow-id',
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
      input: { test: 'data' },
      output: { result: 'success' },
      ...overrides
    };
}
}

// Mock factories for creating mock implementations
export class MockFactory {
  static createMockRepository<_T>(): any {
    return {
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
      findPaginated: jest.fn()
    };
  }

  static createMockService(): any {
    return {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
