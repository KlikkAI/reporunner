# @klikkflow/sdk

TypeScript SDK for the KlikkFlow workflow automation platform.

## Overview

The KlikkFlow SDK provides a comprehensive TypeScript client for interacting with the KlikkFlow platform programmatically. It includes:

- **Full API Coverage** - Complete access to all KlikkFlow APIs
- **Type Safety** - Comprehensive TypeScript definitions
- **Real-time Updates** - WebSocket integration for live workflow monitoring
- **Error Handling** - Robust error handling with automatic retries
- **Authentication** - Built-in API key and token management

## Installation

```bash
pnpm add @klikkflow/sdk
# or
pnpm add @klikkflow/sdk
```

## Quick Start

```typescript
import { createClient } from "@klikkflow/sdk";

// Initialize the client
const client = createClient({
  apiUrl: "http://localhost:5000",
  apiKey: "your-api-key",
  enableWebSocket: true,
});

// Create a workflow
const workflow = await client.createWorkflow({
  name: "My Automated Workflow",
  description: "Processes incoming data",
  nodes: [
    {
      id: "trigger-1",
      type: "webhook-trigger",
      position: { x: 100, y: 100 },
      data: { path: "/webhook/data" },
    },
  ],
  edges: [],
  active: true,
});

// Execute the workflow
const execution = await client.executeWorkflow(workflow.id, {
  inputData: { message: "Hello World" },
});

// Monitor execution progress
client.onExecutionUpdate((executionResult) => {
  console.log("Execution update:", executionResult.status);
});
```

## Core Features

### Workflow Management

```typescript
// Get all workflows
const workflows = await client.getWorkflows();

// Get specific workflow
const workflow = await client.getWorkflow("workflow-id");

// Update workflow
const updated = await client.updateWorkflow("workflow-id", {
  active: false,
});

// Delete workflow
await client.deleteWorkflow("workflow-id");
```

### Execution Control

```typescript
// Execute workflow
const execution = await client.executeWorkflow("workflow-id", inputData);

// Get execution details
const details = await client.getExecution("execution-id");

// Cancel execution
await client.cancelExecution("execution-id");

// Get execution history
const executions = await client.getExecutions("workflow-id");
```

### Credential Management

```typescript
// Create credential
const credential = await client.createCredential({
  name: "Gmail OAuth",
  type: "oauth2",
  data: {
    clientId: "your-client-id",
    clientSecret: "your-client-secret",
  },
});

// Test credential
const isValid = await client.testCredential("credential-id");

// Update credential
await client.updateCredential("credential-id", updatedData);
```

### Real-time Monitoring

```typescript
// Monitor workflow executions
client.onExecutionUpdate((execution) => {
  console.log(`Workflow ${execution.workflowId}: ${execution.status}`);
});

// Monitor workflow changes
client.onWorkflowUpdate((workflow) => {
  console.log(`Workflow updated: ${workflow.name}`);
});

// Check connection status
if (client.ping()) {
  console.log("API is reachable");
}
```

## Configuration Options

```typescript
interface KlikkFlowClientConfig {
  apiUrl?: string; // API base URL (default: http://localhost:5000)
  apiKey?: string; // Authentication API key
  timeout?: number; // Request timeout in ms (default: 30000)
  enableWebSocket?: boolean; // Enable real-time updates (default: false)
  wsUrl?: string; // WebSocket URL (default: ws://localhost:5000)
}
```

## Error Handling

The SDK provides comprehensive error handling:

```typescript
try {
  const workflow = await client.getWorkflow("invalid-id");
} catch (error) {
  if (error.response?.status === 404) {
    console.log("Workflow not found");
  } else if (error.code === "NETWORK_ERROR") {
    console.log("Network connection failed");
  } else {
    console.log("Unexpected error:", error.message);
  }
}
```

## WebSocket Events

Available real-time events:

- `execution:update` - Workflow execution progress
- `workflow:update` - Workflow definition changes
- `node:update` - Individual node execution status
- `connected` - WebSocket connection established
- `disconnected` - WebSocket connection lost
- `error` - WebSocket error occurred

## API Reference

See the [full API documentation](../../docs/api/sdk/) for detailed information about all methods and types.

## Examples

Check out the [examples directory](./examples/) for complete usage examples:

- Basic workflow management
- Real-time monitoring setup
- Credential management
- Error handling patterns
- Advanced integrations

## Contributing

Contributions are welcome! Please see the [Contributing Guide](../../CONTRIBUTING.md) for development setup and guidelines.
