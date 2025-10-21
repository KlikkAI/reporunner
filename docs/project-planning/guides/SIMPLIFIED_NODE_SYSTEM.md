# 🎛️ Simplified Node Management System

## 🎯 **Design Principles**

### **Simple but Powerful**
- Single registry for all nodes
- Clear, debuggable execution flow
- Type-safe throughout
- Easy to extend and maintain

### **Scalable Architecture**
- Can handle thousands of nodes
- Efficient caching and validation
- Horizontal scaling support
- Performance monitoring built-in

### **Developer-Friendly**
- Minimal boilerplate
- Clear error messages
- Rich debugging information
- Hot-reloading support

## 🏗️ **Core Architecture**

### **1. Single Node Registry**
```typescript
// @klikkflow/nodes/src/NodeRegistry.ts
export class NodeRegistry {
  // Core methods
  register(definition, executor, validator?)
  get(nodeId): NodeDefinition | null
  validate(nodeId, config): ValidationResult
  execute(nodeId, config, context): NodeResult

  // Management
  list(options?): NodeDefinition[]
  unregister(nodeId): boolean

  // Debugging
  getStats(): RegistryStats
  export(): NodeDefinition[]
}
```

### **2. Clean Node Definition**
```typescript
export interface NodeDefinition {
  // Identity
  id: string;                    // 'http-request'
  name: string;                  // 'HTTP Request'
  category: NodeCategory;        // 'action'
  version: string;               // '1.0.0'
  description: string;           // Human-readable description

  // UI Configuration
  ui: {
    icon: string;                // 'globe'
    color: string;               // '#3B82F6'
    properties: PropertyDefinition[];
  };

  // Optional Features
  credentials?: CredentialType[];
  webhooks?: WebhookDefinition[];
  tags?: string[];
  deprecated?: boolean;
  experimental?: boolean;

  // Execution (added by registry)
  execute: NodeExecuteFunction;
  validate?: NodeValidateFunction;
}
```

### **3. Simple Property System**
```typescript
export interface PropertyDefinition {
  name: string;                  // 'url'
  type: PropertyType;            // 'string' | 'number' | 'select' | etc.
  required: boolean;             // true
  default?: any;                 // Default value
  description?: string;          // Help text

  // Validation
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: any) => ValidationResult;
  };

  // UI Options
  options?: Array<{
    label: string;
    value: any;
  }>;
}
```

## 🔧 **Implementation Examples**

### **HTTP Request Node**
```typescript
// @klikkflow/nodes/src/definitions/actions/http-request.node.ts
import type { NodeDefinition, NodeExecuteFunction } from '@klikkflow/types';

const execute: NodeExecuteFunction = async (config, context) => {
  try {
    const { url, method, headers, body } = config;

    const response = await fetch(url, {
      method: method || 'GET',
      headers: headers || {},
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: data
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

export const httpRequestNode: NodeDefinition = {
  id: 'http-request',
  name: 'HTTP Request',
  category: 'action',
  version: '1.0.0',
  description: 'Make HTTP requests to external APIs',

  ui: {
    icon: 'globe',
    color: '#3B82F6',
    properties: [
      {
        name: 'url',
        type: 'string',
        required: true,
        description: 'The URL to send the request to',
        validation: {
          pattern: '^https?://.*'
        }
      },
      {
        name: 'method',
        type: 'select',
        required: false,
        default: 'GET',
        description: 'HTTP method',
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'DELETE', value: 'DELETE' }
        ]
      },
      {
        name: 'headers',
        type: 'object',
        required: false,
        description: 'Request headers'
      },
      {
        name: 'body',
        type: 'object',
        required: false,
        description: 'Request body (for POST/PUT)'
      }
    ]
  },

  tags: ['http', 'api', 'request'],
  execute
};
```

### **Email Send Node**
```typescript
// @klikkflow/nodes/src/definitions/actions/email-send.node.ts
const execute: NodeExecuteFunction = async (config, context) => {
  try {
    const { to, subject, body, from } = config;

    // Get email credentials from context
    const credentials = context.getCredentials('email');
    if (!credentials) {
      throw new Error('Email credentials not configured');
    }

    // Send email using configured service
    const emailService = context.getService('email');
    const result = await emailService.send({
      from: from || credentials.defaultFrom,
      to,
      subject,
      html: body
    });

    return {
      success: true,
      data: {
        messageId: result.messageId,
        sentAt: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

export const emailSendNode: NodeDefinition = {
  id: 'email-send',
  name: 'Send Email',
  category: 'action',
  version: '1.0.0',
  description: 'Send emails via configured email service',

  ui: {
    icon: 'envelope',
    color: '#DC2626',
    properties: [
      {
        name: 'to',
        type: 'string',
        required: true,
        description: 'Recipient email address',
        validation: {
          pattern: '^[^@]+@[^@]+\\.[^@]+$'
        }
      },
      {
        name: 'subject',
        type: 'string',
        required: true,
        description: 'Email subject'
      },
      {
        name: 'body',
        type: 'text',
        required: true,
        description: 'Email body (HTML supported)'
      },
      {
        name: 'from',
        type: 'string',
        required: false,
        description: 'Sender email (optional)'
      }
    ]
  },

  credentials: ['email'],
  tags: ['email', 'notification'],
  execute
};
```

### **Condition Node**
```typescript
// @klikkflow/nodes/src/definitions/conditions/if.node.ts
const execute: NodeExecuteFunction = async (config, context) => {
  try {
    const { condition, operator, value } = config;
    const inputData = context.getInputData();

    let result = false;

    switch (operator) {
      case 'equals':
        result = inputData[condition] === value;
        break;
      case 'not_equals':
        result = inputData[condition] !== value;
        break;
      case 'greater_than':
        result = Number(inputData[condition]) > Number(value);
        break;
      case 'less_than':
        result = Number(inputData[condition]) < Number(value);
        break;
      case 'contains':
        result = String(inputData[condition]).includes(String(value));
        break;
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }

    return {
      success: true,
      data: {
        condition: result,
        inputValue: inputData[condition],
        expectedValue: value,
        operator
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

export const ifNode: NodeDefinition = {
  id: 'if',
  name: 'If Condition',
  category: 'condition',
  version: '1.0.0',
  description: 'Evaluate conditions and control workflow flow',

  ui: {
    icon: 'code-branch',
    color: '#7C3AED',
    properties: [
      {
        name: 'condition',
        type: 'string',
        required: true,
        description: 'Field to evaluate'
      },
      {
        name: 'operator',
        type: 'select',
        required: true,
        description: 'Comparison operator',
        options: [
          { label: 'Equals', value: 'equals' },
          { label: 'Not Equals', value: 'not_equals' },
          { label: 'Greater Than', value: 'greater_than' },
          { label: 'Less Than', value: 'less_than' },
          { label: 'Contains', value: 'contains' }
        ]
      },
      {
        name: 'value',
        type: 'string',
        required: true,
        description: 'Value to compare against'
      }
    ]
  },

  tags: ['condition', 'logic', 'control'],
  execute
};
```

## 🔄 **Usage Examples**

### **Register Nodes**
```typescript
import { NodeRegistry } from '@klikkflow/nodes';
import { httpRequestNode } from './definitions/actions/http-request.node';
import { emailSendNode } from './definitions/actions/email-send.node';
import { ifNode } from './definitions/conditions/if.node';

const nodeRegistry = new NodeRegistry();

// Register nodes
nodeRegistry.register(httpRequestNode, httpRequestNode.execute);
nodeRegistry.register(emailSendNode, emailSendNode.execute);
nodeRegistry.register(ifNode, ifNode.execute);

console.log('Registered nodes:', nodeRegistry.getStats());
```

### **Execute Nodes**
```typescript
// Execute HTTP request
const httpResult = await nodeRegistry.execute('http-request', {
  url: 'https://api.example.com/data',
  method: 'GET'
}, context);

console.log('HTTP Result:', httpResult);

// Execute condition
const conditionResult = await nodeRegistry.execute('if', {
  condition: 'status',
  operator: 'equals',
  value: 'success'
}, context);

console.log('Condition Result:', conditionResult);
```

### **Validate Configuration**
```typescript
// Validate node configuration
const validation = await nodeRegistry.validate('http-request', {
  url: 'invalid-url',  // This will fail validation
  method: 'GET'
});

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

## 🎨 **Frontend Integration**

### **Node Palette**
```typescript
// frontend/src/components/NodePalette.tsx
import { useNodes } from '../hooks/useNodes';

export function NodePalette() {
  const { nodes, loading } = useNodes();

  const nodesByCategory = nodes.reduce((acc, node) => {
    if (!acc[node.category]) acc[node.category] = [];
    acc[node.category].push(node);
    return acc;
  }, {});

  return (
    <div className="node-palette">
      {Object.entries(nodesByCategory).map(([category, categoryNodes]) => (
        <div key={category} className="category">
          <h3>{category}</h3>
          {categoryNodes.map(node => (
            <NodeItem key={node.id} node={node} />
          ))}
        </div>
      ))}
    </div>
  );
}
```

### **Node Configuration**
```typescript
// frontend/src/components/NodeConfiguration.tsx
import { useNodeValidation } from '../hooks/useNodeValidation';

export function NodeConfiguration({ nodeId, config, onChange }) {
  const { validation, validate } = useNodeValidation(nodeId);

  const handleConfigChange = async (newConfig) => {
    onChange(newConfig);
    await validate(newConfig);
  };

  return (
    <div className="node-config">
      <PropertyRenderer
        properties={node.ui.properties}
        values={config}
        onChange={handleConfigChange}
        validation={validation}
      />
    </div>
  );
}
```

## 📊 **Debugging & Monitoring**

### **Execution Tracing**
```typescript
// Built into NodeRegistry
const result = await nodeRegistry.execute('http-request', config, context);

// Automatic tracing:
console.log('Execution trace:', {
  nodeId: 'http-request',
  startTime: '2024-01-01T10:00:00Z',
  endTime: '2024-01-01T10:00:02Z',
  duration: 2000,
  success: true,
  input: config,
  output: result
});
```

### **Performance Metrics**
```typescript
// Get node performance metrics
const metrics = nodeRegistry.getNodeMetrics('http-request');
console.log('Node metrics:', {
  executionCount: 1250,
  averageExecutionTime: 850,
  errorRate: 0.02,
  lastExecuted: '2024-01-01T10:00:00Z'
});
```

### **Registry Statistics**
```typescript
// Get registry statistics
const stats = nodeRegistry.getStats();
console.log('Registry stats:', {
  totalNodes: 45,
  nodesByCategory: {
    trigger: 8,
    action: 25,
    condition: 7,
    transform: 5
  },
  cacheHitRate: 0.95
});
```

## 🚀 **Benefits**

### **Simplicity**
- Single registry for all nodes
- Clear, consistent API
- Minimal boilerplate code
- Easy to understand and use

### **Power**
- Rich validation system
- Built-in caching and performance monitoring
- Flexible property system
- Extensible architecture

### **Scalability**
- Can handle thousands of nodes
- Efficient memory usage
- Horizontal scaling support
- Performance optimizations

### **Debuggability**
- Rich error messages
- Execution tracing
- Performance metrics
- Clear logging

### **Maintainability**
- Type-safe throughout
- Clear separation of concerns
- Easy to test
- Hot-reloading support

This simplified node system provides all the power and flexibility needed while being much easier to understand, debug, and maintain than the current complex multi-registry approach.
