/**
 * Operation Model for Operational Transform
 * Stores all collaborative operations for conflict resolution and history
 */

import mongoose, { type Document, Schema } from 'mongoose';

export interface IOperation extends Document {
  _id: string;
  sessionId: string;
  workflowId: string;
  userId: string;
  operationId: string; // Unique operation ID for OT
  parentOperationId?: string; // For operation chains
  type:
    | 'node_add'
    | 'node_delete'
    | 'node_update'
    | 'node_move'
    | 'edge_add'
    | 'edge_delete'
    | 'edge_update'
    | 'property_update'
    | 'bulk_update'
    | 'transform';
  target: {
    type: 'node' | 'edge' | 'workflow' | 'property';
    id: string;
    path?: string; // For nested property updates
  };
  data: {
    before?: any; // Previous state
    after?: any; // New state
    delta?: any; // Change description
  };
  position: {
    x?: number;
    y?: number;
    index?: number; // For ordered operations
  };
  version: number; // Session version when operation was created
  appliedVersion?: number; // Version when operation was applied
  status: 'pending' | 'applied' | 'rejected' | 'transformed';
  transformations: Array<{
    operationId: string;
    type: 'composition' | 'transformation';
    timestamp: Date;
  }>;
  conflicts: Array<{
    conflictingOperationId: string;
    resolutionStrategy: 'auto' | 'manual' | 'priority';
    resolvedBy?: string;
    resolvedAt?: Date;
  }>;
  metadata: {
    clientId: string;
    timestamp: Date;
    latency?: number;
    retryCount?: number;
    source: 'user' | 'system' | 'sync';
  };
  createdAt: Date;
  updatedAt: Date;
}

const operationSchema = new Schema<IOperation>(
  {
    sessionId: {
      type: String,
      required: true,
      ref: 'CollaborationSession',
    },
    workflowId: {
      type: String,
      required: true,
      ref: 'Workflow',
    },
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    operationId: {
      type: String,
      required: true,
      unique: true,
    },
    parentOperationId: {
      type: String,
      ref: 'Operation',
    },
    type: {
      type: String,
      enum: [
        'node_add',
        'node_delete',
        'node_update',
        'node_move',
        'edge_add',
        'edge_delete',
