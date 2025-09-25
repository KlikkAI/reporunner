import type { OpenAPIV3 } from 'openapi-types';
import { createZodOpenApiSpec } from 'zod-to-openapi';
import { ExecutionSchema, OrganizationSchema, UserSchema, WorkflowSchema } from '../schemas';

export function generateOpenAPISpec(): OpenAPIV3.Document {
  const spec: OpenAPIV3.Document = {
    openapi: '3.0.3',
    info: {
      title: 'Reporunner API',
      version: '1.0.0',
      description: `
# Reporunner API

Welcome to the Reporunner API documentation. This API provides comprehensive workflow automation capabilities with enterprise-grade features.

## Features

- 🔄 **Workflow Management**: Create, update, execute, and monitor workflows
- 🔐 **Enterprise Authentication**: JWT, OAuth2, SAML, and SSO support
- 🤖 **AI Integration**: Native AI and ML capabilities
- 📊 **Real-time Monitoring**: Live execution tracking and analytics
- 🔌 **Extensible Nodes**: Plugin architecture for custom integrations
- 🏢 **Multi-tenant**: Organization-based isolation and management

## Authentication

Most endpoints require authentication. Include your access token in the Authorization header:

\`\`\`
Authorization: Bearer YOUR_ACCESS_TOKEN
\`\`\`

## Rate Limiting

API requests are rate limited to prevent abuse:
- **Standard**: 1000 requests per 15 minutes per IP
- **Authenticated**: 5000 requests per 15 minutes per user

## Webhooks

Reporunner supports webhooks for real-time notifications of workflow events.

## SDKs

Official SDKs are available for:
- TypeScript/JavaScript
- Python
- Go

## Support

- 📖 [Documentation](https://docs.reporunner.com)
- 💬 [Discord Community](https://discord.gg/reporunner)
- 🐛 [Bug Reports](https://github.com/reporunner/reporunner/issues)
      `,
      contact: {
        name: 'Reporunner Team',
        url: 'https://reporunner.com',
        email: 'support@reporunner.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://api.reporunner.com',
        description: 'Production server',
      },
    ],
    security: [
      {
        bearerAuth: [],
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for server-to-server authentication',
        },
      },
      schemas: {
        // Core schemas
        Workflow: createZodOpenApiSpec(WorkflowSchema).components?.schemas?.Workflow || {},
        Execution: createZodOpenApiSpec(ExecutionSchema).components?.schemas?.Execution || {},
        User: createZodOpenApiSpec(UserSchema).components?.schemas?.User || {},
