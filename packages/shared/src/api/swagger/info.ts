import type { OpenAPIV3 } from 'openapi-types';

/**
 * OpenAPI info and server configuration
 */
export const apiInfo: OpenAPIV3.InfoObject = {
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
};

/**
 * OpenAPI server configuration
 */
export const apiServers: OpenAPIV3.ServerObject[] = [
  {
    url: 'http://localhost:3001',
    description: 'Development server',
  },
  {
    url: 'https://api.reporunner.com',
    description: 'Production server',
  },
];
