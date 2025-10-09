/**
 * Template Integration Index
 * Template: Replace TemplateIntegration with your integration name
 *
 * This file exports all integration components and registers the node
 */

import { TemplateIntegrationActions } from './actions';
import { TemplateIntegrationCredentials } from './credentials';
import { TemplateIntegrationNode } from './node';
import { TemplateIntegrationProperties } from './properties';

// Note: Uncomment below when integrating with actual node registry
// import { nodeRegistry } from '@/core/nodes/registry';
// nodeRegistry.set('template-integration', TemplateIntegrationNode);

export {
  TemplateIntegrationNode,
  TemplateIntegrationProperties,
  TemplateIntegrationCredentials,
  TemplateIntegrationActions,
};

export default TemplateIntegrationNode;
