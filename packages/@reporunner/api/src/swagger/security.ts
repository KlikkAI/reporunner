import type { OpenAPIV3 } from 'openapi-types';

/**
 * OpenAPI security scheme definitions
 */
export const securitySchemes: Record<string, OpenAPIV3.SecuritySchemeObject> = {
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
};

/**
 * Default security requirements for authenticated endpoints
 */
export const defaultSecurity: OpenAPIV3.SecurityRequirementObject[] = [
  {
    bearerAuth: [],
  },
];