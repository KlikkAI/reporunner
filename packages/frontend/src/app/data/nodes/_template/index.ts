{INTEGRATION_NAME}Node } from './node';{INTEGRATION_NAME}Properties } from './properties';{INTEGRATION_NAME}Credentials } from './credentials';{INTEGRATION_NAME}Actions } from './actions';

// Register node with the registry
import { nodeRegistry } from '@/core/nodes/registry';{INTEGRATION_NAME}Node } from './node';

nodeRegistry.set('{integration-id}', {INTEGRATION_NAME}Node);
