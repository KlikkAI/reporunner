/**
 * Enhanced Execution State Management
 *
 * Provides real-time execution state tracking with visual feedback,
 * inspired by SIM's AI-powered execution monitoring and n8n's
 * enterprise-grade execution tracking.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  type ExecutionEvent,
  type ExecutionEventHandler,
  executionMonitor,
} from '@/app/services/executionMonitor';
import type { WorkflowExecution } from '@/core/schemas';

export interface NodeExecutionState {
  nodeId: string;
  status: 'idle' | 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: string;
  endTime?: string;
  duration?: number;
  inputData?: any;
  outputData?: any;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  metrics?: {
    memoryUsage?: number;
    cpuTime?: number;
    ioOperations?: number;
  };
  debugInfo?: {
    breakpoint?: boolean;
    watchedVariables?: Record<string, any>;
    logs?: Array<{
      level: 'debug' | 'info' | 'warn' | 'error';
      message: string;
      timestamp: string;
    }>;
  };
}

export interface ExecutionProgress {
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  skippedNodes: number;
  currentNodeId?: string;
  estimatedTimeRemaining?: number;
  progressPercentage: number;
}

export interface EnhancedExecutionState {
  // Current execution tracking
  currentExecution: WorkflowExecution | null;
  executionHistory: WorkflowExecution[];

  // Real-time node states
  nodeStates: Map<string, NodeExecutionState>;
  activeNodes: Set<string>;
  pendingNodes: Set<string>;
  completedNodes: Set<string>;
  failedNodes: Set<string>;

  // Execution progress
  progress: ExecutionProgress | null;

  // Performance metrics
  performanceMetrics: {
    totalExecutionTime?: number;
    nodeExecutionTimes: Map<string, number>;
    resourceUsage: {
      peakMemory?: number;
      totalCpuTime?: number;
      networkRequests?: number;
    };
  };

  // Real-time updates
  isConnected: boolean;
  lastUpdateTimestamp: string | null;
  subscriptions: Set<string>;

  // Debug mode
  debugMode: boolean;
  breakpoints: Set<string>;
  stepMode: boolean;
  currentStepNodeId?: string;

  // Actions
  startExecution: (workflowId: string, testMode?: boolean) => Promise<string>;
  stopExecution: (executionId: string) => Promise<void>;
  subscribeToExecution: (executionId: string) => Promise<void>;
  unsubscribeFromExecution: (executionId: string) => void;

// Node state management
