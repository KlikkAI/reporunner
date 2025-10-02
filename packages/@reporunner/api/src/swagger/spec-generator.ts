import type { OpenAPIV3 } from 'openapi-types';
import { apiInfo, apiServers } from './info';
import { commonParameters } from './parameters';
import { apiPaths } from './paths';
import { commonResponses } from './responses';
import { allSchemas } from './schemas';
import { commonSchemas } from './schemas';
import { defaultSecurity, securitySchemes } from './security';
import { apiTags } from './tags';

/**
 * Generate complete OpenAPI specification
 *
 * This generates a comprehensive OpenAPI 3.0.3 specification with:
 * - Detailed request/response schemas
 * - Authentication flows
 * - Complete API paths with examples
 * - Error responses
 * - Validation rules
 */
export function generateOpenAPISpec(): OpenAPIV3.Document {
  const spec: OpenAPIV3.Document = {
    openapi: '3.0.3',
    info: apiInfo,
    servers: apiServers,
    security: defaultSecurity,
    components: {
      securitySchemes,
      schemas: {
        // Comprehensive schemas for all entities
        ...allSchemas,

        // Legacy common schemas for backward compatibility
        ...commonSchemas,
      },
      responses: commonResponses,
      parameters: commonParameters,
    },
    // Comprehensive API paths with full request/response definitions
    paths: apiPaths,
    tags: apiTags,
  };

  return spec;
}
