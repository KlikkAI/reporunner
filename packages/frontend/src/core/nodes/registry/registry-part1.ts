/* eslint-disable @typescript-eslint/no-explicit-any */

import type { EnhancedIntegrationNodeType, PropertyFormState } from '../types/dynamicProperties';
import type { ICredentialType, INodeType, INodeTypeDescription } from './types';

/**
 * Enterprise-Grade Registry Interfaces
 */
interface NodeCapabilityDefinition {
  id: string;
  supportedModes: ('trigger' | 'action' | 'webhook' | 'poll')[];
  resources: string[];
  operations: Record<string, string[]>;
  contextAware: boolean;
  scalingProfile: 'light' | 'standard' | 'enterprise';
  tenantIsolation: boolean;
}

export interface ContextResolver {
  id: string;
  resolve: (context: WorkflowContext) => Promise<ResolvedContext | null>;
  priority: number;
}

export interface WorkflowContext {
  nodeId: string;
  workflowId: string;
  isWorkflowStart: boolean;
  hasInputConnections: boolean;
  position: { x: number; y: number };
  tenantId?: string;
  userContext?: any;
  formState?: PropertyFormState;
}

export interface ResolvedContext {
  mode: 'trigger' | 'action' | 'webhook' | 'poll';
  resource: string;
  operation?: string;
  properties: any[];
  capabilities: string[];
}

interface NodePerformanceMetrics {
  nodeId: string;
  executionCount: number;
  averageExecutionTime: number;
  errorRate: number;
  lastExecuted: number;
  resourceUsage: {
    cpu: number;
    memory: number;
    network: number;
  };
}

interface RegistryPlugin {
  id: string;
  name: string;
  version: string;
  initialize: (registry: NodeRegistry) => Promise<void>;
  extend: (nodeType: string, extensions: any) => void;
}

/**
 * Enterprise-Grade NodeRegistry for Large-Scale Platform Engineering
 *
 * Features:
 * - Pure registry pattern with dynamic node registration
 * - Multi-tenant isolation and enterprise scalability
 * - Context-aware node resolution with smart mode detection
 * - Plugin architecture for runtime extensions
 * - Performance monitoring and analytics
 * - A/B testing capabilities for node configurations
 */
class NodeRegistry {
  private static instance: NodeRegistry;

  // Core Registry Maps
  private nodeTypes: Map<string, INodeType> = new Map();
  private enhancedNodeTypes: Map<string, EnhancedIntegrationNodeType> = new Map();
  private credentialTypes: Map<string, ICredentialType> = new Map();
  private categories: Set<string> = new Set();

  // Enterprise Features
  private nodeCapabilities: Map<string, NodeCapabilityDefinition> = new Map();
  private contextResolvers: Map<string, ContextResolver> = new Map();
  private tenantRegistries: Map<string, Map<string, any>> = new Map();
  private performanceMetrics: Map<string, NodePerformanceMetrics> = new Map();
  private featureFlags: Map<string, boolean> = new Map();

  // Registry State
  private registryVersion = 1;
  private lastUpdate = Date.now();

  private constructor() {
    // Private constructor for singleton pattern
  }

/**
