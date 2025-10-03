/**
 * Integration Template
 *
 * Copy this template for new integrations:
 * 1. Replace {INTEGRATION_NAME} with your integration name (e.g., "Slack")
 * 2. Replace {integration-id} with lowercase-dash format (e.g., "slack")
 * 3. Update category to match (ai-ml, communication, data-storage, etc.)
 */

export { {INTEGRATION_NAME}Node } from './node';
export { {INTEGRATION_NAME}Properties } from './properties';
export { {INTEGRATION_NAME}Credentials } from './credentials';
export { {INTEGRATION_NAME}Actions } from './actions';

// Register node with the registry
import { nodeRegistry } from '@/core/nodes/registry';
import { {INTEGRATION_NAME}Node } from './node';

nodeRegistry.set('{integration-id}', {INTEGRATION_NAME}Node);
