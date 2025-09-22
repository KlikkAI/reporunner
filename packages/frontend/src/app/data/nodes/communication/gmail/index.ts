// Gmail Node - Enterprise Registry Pattern Implementation
import { nodeRegistry } from '@/core/nodes/registry';
import { executeGmailSend, executeGmailTrigger, testGmailConnection } from './actions';
import { gmailCredentials } from './credentials';
import {
  executeGmailEnhanced,
  gmailEnhancedNode,
  gmailNodeCapabilities,
  testGmailEnhancedConnection,
} from './enhanced-node';
import { registerGmailContextResolver } from './gmail-context-resolver';
// Legacy imports for backward compatibility
import { gmailNodeMetadata } from './node';
import { gmailSendProperties, gmailTriggerProperties } from './properties';

// =============================================================================
// ENTERPRISE REGISTRY IMPLEMENTATION
// =============================================================================

/**
 * Initialize and register the unified Gmail node with enterprise features
 */
export function initializeGmailNode(): void {
  console.log('🚀 Initializing Enterprise Gmail Node...');
  console.log('📧 Gmail Enhanced Node Data:', gmailEnhancedNode);

  // Register the Gmail context resolver for smart mode detection
  registerGmailContextResolver();

  // Register the enhanced Gmail node with enterprise registry
  console.log('📝 Registering Gmail Enhanced Node with Registry...');
  nodeRegistry.registerEnhancedNodeType(gmailEnhancedNode);

  // Set up feature flags for Gmail
  nodeRegistry.setFeatureFlag('gmail_unified_mode', true);
  nodeRegistry.setFeatureFlag('gmail_smart_detection', true);
  nodeRegistry.setFeatureFlag('gmail_progressive_ui', true);

  // Verify registration
  const enhancedNodes = nodeRegistry.getAllEnhancedNodeTypes();
  console.log(
    '🔍 Enhanced nodes in registry:',
    enhancedNodes.map((node) => ({
      id: node.id,
      displayName: node.displayName,
    }))
  );

  const hasGmailNode = enhancedNodes.some((node) => node.id === 'gmail-enhanced');
  console.log('🔍 Gmail node registration verification:', hasGmailNode ? 'SUCCESS' : 'FAILED');

  // Show all registered nodes
  const allDescriptions = nodeRegistry.getAllNodeTypeDescriptions();
  console.log(
    '📋 All registered node descriptions:',
    allDescriptions.map((n) => ({
      name: n.name,
      displayName: n.displayName,
      customBodyComponent: n.customBodyComponent,
    }))
  );

  // Specifically check Gmail node
  const gmailNode = allDescriptions.find((n) => n.name === 'gmail-enhanced');
  console.log(
    '🎯 Gmail node found in registry:',
    gmailNode
      ? {
          name: gmailNode.name,
          displayName: gmailNode.displayName,
          customBodyComponent: gmailNode.customBodyComponent,
          hasCustomBody: Boolean(gmailNode.customBodyComponent),
        }
      : 'NOT FOUND'
  );

  console.log('✅ Enterprise Gmail Node initialized successfully');
  console.log('📊 Registry Stats:', nodeRegistry.getStatistics());
}

// =============================================================================
// UNIFIED GMAIL EXPORT (NEW ARCHITECTURE)
// =============================================================================

/**
 * Primary export - Unified Gmail Node with Enterprise Registry
 */
export const gmailEnhanced = {
  // Node definition
  node: gmailEnhancedNode,
  capabilities: gmailNodeCapabilities,

  // Execution functions
  execute: executeGmailEnhanced,
  test: testGmailEnhancedConnection,

  // Registry integration
  initialize: initializeGmailNode,

  // Metadata
  meta: {
    version: '2.0.0',
    type: 'unified',
    architecture: 'enterprise-registry',
    features: {
      smartModeDetection: true,
      contextAwareProperties: true,
      fullN8nParity: true,
      enterpriseScaling: true,
      multiTenancy: true,
      monitoring: true,
    },
  },
};

// =============================================================================
// UNIFIED ARCHITECTURE - SINGLE NODE REPLACES ALL LEGACY NODES
// =============================================================================

// Single Gmail node handles all operations:
// - Email sending (replaces Gmail Send)
// - Email receiving/triggers (replaces Gmail Trigger)
// - Gmail tool operations (replaces Gmail Tool)
// - Smart mode detection eliminates user confusion

// Unified Gmail integration object (enterprise registry pattern)
export const gmailIntegration = {
  id: 'gmail',
  name: 'Gmail',
  icon: gmailNodeMetadata.icon,
  category: gmailNodeMetadata.category,
  description: gmailNodeMetadata.description,
  isConnected: false,
  credentials: gmailCredentials,

  // Single enhanced node replaces all legacy nodes
  enhancedNodeTypes: [gmailEnhancedNode],

  // No legacy node types - single node handles all operations
  nodeTypes: [],

  // Unified action executor
  actions: {
    enhanced: executeGmailEnhanced,
    test: testGmailEnhancedConnection,
  },
};

// =============================================================================
// COMPONENT EXPORTS
// =============================================================================

// Primary enhanced export - SINGLE GMAIL NODE
export { gmailEnhanced as default };

// Legacy component exports (for backward compatibility)
export {
  gmailNodeMetadata,
  gmailCredentials,
  gmailTriggerProperties,
  gmailSendProperties,
  executeGmailTrigger,
  executeGmailSend,
  testGmailConnection,
};

// New enhanced exports - SINGLE INTELLIGENT GMAIL NODE
export {
  gmailEnhancedNode,
  gmailNodeCapabilities,
  executeGmailEnhanced,
  testGmailEnhancedConnection,
};

// Auto-initialize the Gmail node when imported
initializeGmailNode();
