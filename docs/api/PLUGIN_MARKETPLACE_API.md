# Plugin Marketplace API Documentation

## Overview

The Plugin Marketplace API provides comprehensive functionality for managing plugins, including publishing, searching, downloading, and validation. Built on the consolidated architecture from Phase A, it offers a secure and scalable platform for plugin distribution.

## Base URL

```
/api/marketplace
```

## Authentication

All endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Plugin Search and Discovery

#### `GET /plugins`

Search and browse plugins in the marketplace.

**Query Parameters:**
- `query` (string, optional): Search term for plugin name, description, or tags
- `category` (string, optional): Filter by category (`integration`, `trigger`, `action`, `utility`, `ai`)
- `tags` (array, optional): Filter by tags
- `pricing` (string, optional): Filter by pricing model (`free`, `paid`, `freemium`)
- `verified` (boolean, optional): Filter verified plugins only
- `featured` (boolean, optional): Filter featured plugins only
- `sortBy` (string, optional): Sort field (`name`, `downloads`, `rating`, `updated`)
- `sortOrder` (string, optional): Sort order (`asc`, `desc`)
- `limit` (number, optional): Results per page (1-100, default: 20)
- `offset` (number, optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "plugins": [
      {
        "id": "plugin-id",
        "name": "Plugin Name",
        "version": "1.0.0",
        "description": "Plugin description",
        "author": "Author Name",
        "category": "integration",
        "tags": ["api", "webhook"],
        "pricing": "free",
        "rating": 4.5,
        "reviews": 25,
        "downloads": 1500,
        "verified": true,
        "featured": false,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-15T00:00:00Z"
      }
    ],
    "total": 150,
    "hasMore": true
  }
}
```

#### `GET /plugins/:pluginId`

Get detailed information about a specific plugin.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "plugin-id",
    "name": "Plugin Name",
    "version": "1.0.0",
    "description": "Detailed plugin description",
    "author": "Author Name",
    "category": "integration",
    "tags": ["api", "webhook"],
    "pricing": "free",
    "license": "MIT",
    "repository": "https://github.com/user/plugin",
    "documentation": "https://docs.plugin.com",
    "screenshots": ["https://example.com/screenshot1.png"],
    "compatibility": {
      "minVersion": "1.0.0",
      "maxVersion": "2.0.0"
    },
    "dependencies": ["dependency1", "dependency2"],
    "permissions": ["network", "filesystem"],
    "rating": 4.5,
    "reviews": 25,
    "downloads": 1500,
    "verified": true,
    "featured": false,
    "versions": [
      {
        "version": "1.0.0",
        "publishedAt": "2024-01-01T00:00:00Z",
        "downloads": 1500,
        "isLatest": true
      }
    ]
  }
}
```

### Plugin Publishing

#### `POST /plugins`

Publish a new plugin or update an existing one.

**Request Body:**
```json
{
  "pluginPackage": {
    "metadata": {
      "id": "my-plugin",
      "name": "My Awesome Plugin",
      "version": "1.0.0",
      "description": "Plugin description",
      "author": "Author Name",
      "category": "integration",
      "tags": ["api", "webhook"],
      "license": "MIT",
      "pricing": "free",
      "repository": "https://github.com/user/plugin",
      "documentation": "https://docs.plugin.com",
      "compatibility": {
        "minVersion": "1.0.0"
      }
    },
    "manifest": {
      "main": "index.js",
      "nodes": ["node1.js", "node2.js"],
      "credentials": ["credential1.js"],
      "webhooks": ["webhook1.js"]
    },
    "bundle": "base64-encoded-zip-file",
    "checksum": "sha256-checksum"
  },
  "releaseNotes": "What's new in this version",
  "tags": ["additional", "tags"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pluginId": "my-plugin",
    "version": "1.0.0",
    "downloadUrl": "/api/marketplace/plugins/my-plugin/versions/1.0.0/download"
  }
}
```

#### `POST /plugins/:pluginId/validate`

Validate a plugin without publishing.

**Request Body:**
```json
{
  "metadata": { /* plugin metadata */ },
  "manifest": { /* plugin manifest */ },
  "bundle": "base64-encoded-zip-file",
  "checksum": "sha256-checksum"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "score": 85,
    "issues": [
      {
        "severity": "medium",
        "category": "security",
        "message": "Consider using safer alternatives to detected patterns",
        "file": "index.js",
        "line": 42
      }
    ],
    "recommendations": [
      "Add comprehensive documentation",
      "Implement proper error handling"
    ],
    "securityScan": {
      "passed": true,
      "vulnerabilities": []
    },
    "performanceMetrics": {
      "bundleSize": 1024000,
      "loadTime": 150,
      "memoryUsage": 512000
    }
  }
}
```

### Plugin Download and Installation

#### `POST /plugins/:pluginId/download`

Download a plugin.

**Request Body:**
```json
{
  "version": "1.0.0"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "/api/marketplace/plugins/my-plugin/versions/1.0.0/download?token=secure-token",
    "pluginPackage": {
      /* complete plugin package */
    }
  }
}
```

#### `GET /plugins/:pluginId/versions/:version/download`

Direct download endpoint with token validation.

**Query Parameters:**
- `token` (string, required): Secure download token

**Response:** Binary plugin bundle file

### Plugin Management

#### `PUT /plugins/:pluginId`

Update plugin metadata.

**Request Body:**
```json
{
  "description": "Updated description",
  "tags": ["updated", "tags"],
  "documentation": "https://new-docs.com"
}
```

#### `DELETE /plugins/:pluginId/versions/:version`

Unpublish a specific version of a plugin.

**Response:**
```json
{
  "success": true,
  "message": "Plugin version unpublished successfully"
}
```

### Marketplace Statistics

#### `GET /stats`

Get marketplace statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPlugins": 150,
    "verifiedPlugins": 45,
    "featuredPlugins": 12,
    "totalDownloads": 25000,
    "categories": {
      "integration": 60,
      "trigger": 30,
      "action": 40,
      "utility": 15,
      "ai": 5
    }
  }
}
```

#### `GET /categories`

Get available plugin categories.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "integration",
      "name": "Integrations",
      "description": "Connect with external services"
    },
    {
      "id": "trigger",
      "name": "Triggers",
      "description": "Start workflows automatically"
    }
  ]
}
```

#### `GET /featured`

Get featured plugins.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      /* featured plugin data */
    }
  ]
}
```

### Plugin Reviews

#### `POST /plugins/:pluginId/review`

Submit a review for a plugin.

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Excellent plugin! Works perfectly."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Review submitted successfully"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": ["Additional error details"]
}
```

## HTTP Status Codes

- `200` - Success
- `201` - Created (for plugin publishing)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (plugin not found)
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- Search endpoints: 100 requests per minute
- Download endpoints: 50 requests per minute
- Publishing endpoints: 10 requests per minute

## Plugin Validation Rules

### Security Validation
- No use of `eval()` or dynamic function creation
- No direct DOM manipulation without sanitization
- Restricted access to sensitive Node.js modules
- Malware and vulnerability scanning

### Performance Validation
- Bundle size limit: 10MB
- No infinite loops or blocking operations
- Memory usage monitoring
- Load time optimization

### Quality Validation
- Proper error handling implementation
- Code documentation requirements
- Naming convention compliance
- Dependency validation

## SDK Integration

Use the provided React hook for frontend integration:

```typescript
import { usePluginMarketplace } from '@/hooks/usePluginMarketplace';

const {
  plugins,
  loading,
  searchPlugins,
  downloadPlugin,
  publishPlugin
} = usePluginMarketplace();
```

## Examples

### Search for Integration Plugins
```bash
curl -X GET "/api/marketplace/plugins?category=integration&sortBy=downloads&limit=10" \
  -H "Authorization: Bearer <token>"
```

### Publish a Plugin
```bash
curl -X POST "/api/marketplace/plugins" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"pluginPackage": {...}, "releaseNotes": "Initial release"}'
```

### Download a Plugin
```bash
curl -X POST "/api/marketplace/plugins/my-plugin/download" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"version": "1.0.0"}'
```
