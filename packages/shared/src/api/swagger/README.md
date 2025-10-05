# OpenAPI/Swagger Documentation

Comprehensive OpenAPI 3.0.3 specification for the Reporunner API.

## Overview

This directory contains a well-organized OpenAPI specification that documents all API endpoints, request/response schemas, authentication methods, and validation rules.

## Structure

```
swagger/
├── spec-generator.ts      # Main spec generator
├── info.ts                # API metadata (version, description, contact)
├── servers.ts             # Server configurations
├── security.ts            # Authentication schemes
├── tags.ts                # API tag definitions
├── parameters.ts          # Reusable parameters
├── responses.ts           # Common responses
├── schemas/               # Request/response schemas
│   ├── index.ts           # Schema exports
│   ├── auth.schemas.ts    # Authentication schemas
│   ├── workflow.schemas.ts # Workflow schemas
│   ├── execution.schemas.ts # Execution schemas
│   ├── credential.schemas.ts # Credential schemas
│   └── common.schemas.ts  # Common/shared schemas
├── paths/                 # API path definitions
│   └── index.ts           # All API endpoints
└── README.md              # This file
```

## Features

### Comprehensive Schemas

Each entity has detailed schemas including:
- **Request schemas**: With validation rules (min/max length, format, required fields)
- **Response schemas**: With examples and descriptions
- **Error schemas**: Standardized error responses
- **Pagination**: Consistent pagination across list endpoints

### API Endpoints (30+ documented)

- **Authentication**: Login, register, refresh token, logout, password reset
- **Workflows**: CRUD operations, execution, activation/deactivation
- **Executions**: List, retrieve, cancel executions
- **Credentials**: CRUD operations, test credentials
- **Users**: Profile management, password change
- **Organizations**: Organization management
- **Nodes**: Node type discovery

### Security

- **Bearer Authentication**: JWT-based auth for protected endpoints
- **Public Endpoints**: Login and register are public
- **Permission-based Access**: Role-based access control

## Usage

### Generate OpenAPI Spec

```typescript
import { generateOpenAPISpec } from './spec-generator';

const spec = generateOpenAPISpec();
```

### Export to JSON

```bash
# Export OpenAPI spec to JSON file
pnpm openapi:export

# Watch mode (auto-export on changes)
pnpm openapi:export:watch
```

### View Documentation

The generated spec can be viewed using:

1. **Swagger UI** - Interactive API documentation
2. **Redoc** - Beautiful API documentation
3. **Postman** - Import for API testing
4. **VS Code Extensions** - Preview in editor

### Access Swagger UI

When the API server is running:
```
http://localhost:3001/api-docs
```

## Adding New Endpoints

### 1. Create Schema (if needed)

Add to appropriate schema file (e.g., `schemas/workflow.schemas.ts`):

```typescript
export const workflowSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  // ... existing schemas

  NewWorkflowFeature: {
    type: 'object',
    required: ['field1', 'field2'],
    properties: {
      field1: {
        type: 'string',
        description: 'Field description',
        example: 'example value',
      },
      field2: {
        type: 'number',
        minimum: 0,
        maximum: 100,
      },
    },
  },
};
```

### 2. Add Path Definition

Add to `paths/index.ts`:

```typescript
export const apiPaths: OpenAPIV3.PathsObject = {
  // ... existing paths

  '/api/v1/workflows/{workflowId}/new-feature': {
    post: {
      tags: ['Workflows'],
      summary: 'Use new feature',
      description: 'Detailed description of the endpoint',
      operationId: 'useNewFeature',
      parameters: [
        {
          name: 'workflowId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Workflow ID',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/NewWorkflowFeature' },
          },
        },
      },
      responses: {
        '200': {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Workflow' },
            },
          },
        },
        '400': {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  },
};
```

### 3. Export the Spec

```bash
pnpm openapi:export
```

## Schema Best Practices

### 1. Use Descriptive Names
```typescript
// Good
CreateWorkflowRequest
WorkflowListResponse

// Bad
Request1
Response2
```

### 2. Include Examples
```typescript
{
  type: 'string',
  description: 'User email address',
  example: 'user@example.com',
}
```

### 3. Add Validation Rules
```typescript
{
  type: 'string',
  minLength: 1,
  maxLength: 200,
  pattern: '^[a-zA-Z0-9-]+$',
}
```

### 4. Document Required Fields
```typescript
{
  type: 'object',
  required: ['field1', 'field2'],
  properties: {
    field1: { type: 'string' },
    field2: { type: 'number' },
    field3: { type: 'string' }, // Optional
  },
}
```

### 5. Use References
```typescript
// Good - reusable
{ $ref: '#/components/schemas/Workflow' }

// Avoid - inline repetition
{ type: 'object', properties: { /* ... */ } }
```

## Path Best Practices

### 1. Use Consistent Naming
```
GET    /api/v1/resources         # List
POST   /api/v1/resources         # Create
GET    /api/v1/resources/{id}    # Retrieve
PUT    /api/v1/resources/{id}    # Update
DELETE /api/v1/resources/{id}    # Delete
POST   /api/v1/resources/{id}/action  # Custom action
```

### 2. Include Operation IDs
```typescript
{
  operationId: 'listWorkflows',  // Unique identifier
  // ...
}
```

### 3. Document All Parameters
```typescript
parameters: [
  {
    name: 'page',
    in: 'query',
    schema: { type: 'number', minimum: 1, default: 1 },
    description: 'Page number for pagination',
  },
]
```

### 4. Document All Response Codes
```typescript
responses: {
  '200': { description: 'Success', /* ... */ },
  '400': { description: 'Validation error', /* ... */ },
  '401': { description: 'Unauthorized', /* ... */ },
  '404': { description: 'Not found', /* ... */ },
  '500': { description: 'Server error', /* ... */ },
}
```

## Validation

The OpenAPI spec can be validated using:

```bash
# Using Swagger CLI
npx @apidevtools/swagger-cli validate openapi.json

# Using Spectral
npx @stoplight/spectral-cli lint openapi.json
```

## Integration with API Server

The spec is automatically served at `/api-docs` when the API server runs:

```typescript
import swaggerUi from 'swagger-ui-express';
import { generateOpenAPISpec } from './swagger/spec-generator';

const spec = generateOpenAPISpec();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));
```

## Tools and Viewers

### Swagger UI
- Interactive documentation
- Try-it-out functionality
- Request/response examples

### Redoc
- Beautiful, responsive documentation
- Three-panel layout
- Great for public API docs

### Postman
- Import spec for API testing
- Generate collections
- Environment variables

### VS Code Extensions
- **OpenAPI (Swagger) Editor** - Preview and edit
- **Swagger Viewer** - View documentation
- **REST Client** - Test endpoints

## CI/CD Integration

### Generate Spec in CI

```yaml
# GitHub Actions
- name: Generate OpenAPI Spec
  run: pnpm openapi:export

- name: Validate Spec
  run: npx @apidevtools/swagger-cli validate openapi.json

- name: Publish to API Portal
  run: # Upload to documentation site
```

### Version Control

- **Commit the spec**: `openapi.json` should be committed
- **Review changes**: OpenAPI diffs in PRs
- **Version docs**: Tag releases with API versions

## Resources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger Editor](https://editor.swagger.io/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [Redoc](https://redocly.github.io/redoc/)
- [OpenAPI Generator](https://openapi-generator.tech/)

## Contributing

When adding new endpoints:
1. Create schemas in appropriate schema file
2. Add path definitions with full documentation
3. Include examples and descriptions
4. Export and validate the spec
5. Test in Swagger UI
6. Update this README if adding new categories
