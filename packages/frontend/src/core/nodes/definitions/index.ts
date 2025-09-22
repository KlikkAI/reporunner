// Node Definitions Index - Complete Registry Migration
// All node types for the lean n8n-inspired architecture

import { nodeRegistry } from '../registry.ts';
import { ActionNode } from './Action.node.ts';
import { AIAgent } from './AIAgent.node.ts';
import { ConditionNode } from './Condition.node.ts';
import { DatabaseNode } from './Database.node.ts';
import { DelayNode } from './Delay.node.ts';
import { EmailNode } from './Email.node.ts';
import { EmbeddingNode } from './Embedding.node.ts';
import { FileNode } from './File.node.ts';
import { HttpRequestNode } from './HttpRequest.node.ts';
import { LLMNode } from './LLM.node.ts';
import { LoopNode } from './Loop.node.ts';
// Import all node classes
import { TransformNode } from './Transform.node.ts';
import { TriggerNode } from './Trigger.node.ts';
import { VectorStoreNode } from './VectorStore.node.ts';
import { VectorStoreToolNode } from './VectorStoreTool.node.ts';
import { WebhookTrigger } from './WebhookTrigger.node.ts';
// Removed old Gmail nodes - now using enhanced unified Gmail node from integration registry

import { Ollama } from './Ollama.node.ts';
import { PgVector } from './PgVector.node.ts';

// Array of all node classes for easy registration
const allNodeClasses = [
  // Core generic nodes
  TransformNode,
  ActionNode,
  ConditionNode,
  HttpRequestNode,
  TriggerNode,
  WebhookTrigger,
  DelayNode,
  LoopNode,
  DatabaseNode,
  EmailNode,
  FileNode,
  AIAgent,
  LLMNode,
  EmbeddingNode,
  VectorStoreNode,
  VectorStoreToolNode,
  // Removed old Gmail nodes - now using enhanced Gmail node from integration registry

  Ollama,
  PgVector,
];

// Register all node types
export function registerAllNodes() {
  console.log('🚀 Registering all node types in registry...');

  allNodeClasses.forEach((NodeClass) => {
    const nodeInstance = new NodeClass();
    console.log(
      `📝 Registering node: ${nodeInstance.description.name} (${nodeInstance.description.displayName})`
    );
    nodeRegistry.registerNodeType(nodeInstance);
  });

  const stats = nodeRegistry.getStatistics();
  console.log(`✅ Successfully registered ${stats.nodeTypesCount} node types:`);
  console.log(`   • Trigger nodes: ${stats.triggerNodes}`);
  console.log(`   • Action nodes: ${stats.actionNodes}`);
  console.log(`   • Categories: ${stats.categoriesCount}`);
  console.log(`   • Credentials: ${stats.credentialTypesCount}`);

  // List all registered node types for debugging
  const allRegisteredTypes = nodeRegistry.getAllNodeTypeDescriptions();
  console.log(
    '🔍 All registered node types:',
    allRegisteredTypes.map((desc) => `${desc.name} (${desc.displayName})`).sort()
  );

  return stats;
}

// Auto-register on import
console.log('🔧 Starting node registration...');
const registrationResult = registerAllNodes();
console.log('✅ Node registration completed:', registrationResult);

export * from './Action.node.ts';
export * from './AIAgent.node.ts';
export * from './Condition.node.ts';
export * from './Database.node.ts';
export * from './Delay.node.ts';
export * from './Email.node.ts';
export * from './Embedding.node.ts';
export * from './File.node.ts';
export * from './HttpRequest.node.ts';
export * from './LLM.node.ts';
export * from './Loop.node.ts';
// Export all node classes for individual usage if needed
export * from './Transform.node.ts';
export * from './Trigger.node.ts';
export * from './VectorStore.node.ts';
export * from './VectorStoreTool.node.ts';
export * from './WebhookTrigger.node.ts';
// Removed old Gmail node exports - now using enhanced Gmail node from integration registry

export * from './Ollama.node.ts';
export * from './PgVector.node.ts';
