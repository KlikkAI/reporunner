/**
 * Centralized export for all OpenAPI schemas
 */

import { authSchemas } from './auth.schemas';
import { commonSchemasDetailed } from './common.schemas';
import { credentialSchemas } from './credential.schemas';
import { executionSchemas } from './execution.schemas';
import { workflowSchemas } from './workflow.schemas';

/**
 * All OpenAPI schemas combined
 */
export const allSchemas = {
  ...commonSchemasDetailed,
  ...authSchemas,
  ...workflowSchemas,
  ...executionSchemas,
  ...credentialSchemas,
};

export {
  authSchemas,
  commonSchemasDetailed,
  credentialSchemas,
  executionSchemas,
  workflowSchemas,
};
