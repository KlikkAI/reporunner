import type { OpenAPIV3 } from 'openapi-types';
import { createZodOpenApiSpec } from 'zod-to-openapi';
import { ExecutionSchema, OrganizationSchema, UserSchema, WorkflowSchema } from '../schemas';
import { apiInfo, apiServers } from './info';
import { commonParameters } from './parameters';
import { commonResponses } from './responses';
import { commonSchemas } from './schemas';
import { defaultSecurity, securitySchemes } from './security';
import { apiTags } from './tags';

/**
 * Generate complete OpenAPI specification
 */
export function generateOpenAPISpec(): OpenAPIV3.Document {
  // Generate Zod schemas for core entities
  const workflowSpec = createZodOpenApiSpec(WorkflowSchema);
  const executionSpec = createZodOpenApiSpec(ExecutionSchema);
  const userSpec = createZodOpenApiSpec(UserSchema);
  const organizationSpec = createZodOpenApiSpec(OrganizationSchema);

  const spec: OpenAPIV3.Document = {
    openapi: '3.0.3',
    info: apiInfo,
    servers: apiServers,
    security: defaultSecurity,
    components: {
      securitySchemes,
      schemas: {
        // Core domain schemas from Zod
        Workflow: workflowSpec.components?.schemas?.Workflow || {},
        Execution: executionSpec.components?.schemas?.Execution || {},
        User: userSpec.components?.schemas?.User || {},
        Organization: organizationSpec.components?.schemas?.Organization || {},

        // Common schemas
        ...commonSchemas,
      },
      responses: commonResponses,
      parameters: commonParameters,
    },
    paths: {
      // Paths will be added by individual route files
    },
    tags: apiTags,
  };

  return spec;
}
