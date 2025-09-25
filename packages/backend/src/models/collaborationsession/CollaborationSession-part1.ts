/**
 * Collaboration Session Model for real-time workflow editing
 * Stores session data in PostgreSQL for persistence and scaling
 */

import mongoose, { type Document, Schema } from 'mongoose';

export interface ICollaborationSession extends Document {
  _id: string;
  workflowId: string;
  sessionId: string;
  ownerId: string;
  organizationId?: string;
  participants: Array<{
    userId: string;
    socketId: string;
    userName: string;
    avatar?: string;
    joinedAt: Date;
    lastSeen: Date;
    lastActivity: Date;
    role: 'owner' | 'editor' | 'viewer';
    cursor?: {
      x: number;
      y: number;
      nodeId?: string;
    };
    selection?: {
      nodeIds: string[];
      edgeIds: string[];
    };
  }>;
  isActive: boolean;
  endedAt?: Date;
  currentVersion: number;
  lastActivity: Date;
  settings: {
    allowAnonymous: boolean;
    maxParticipants: number;
    autoSave: boolean;
    autoSaveInterval: number; // minutes
    conflictResolution: 'last-write-wins' | 'operational-transform' | 'manual';
  };
  status: 'active' | 'paused' | 'ended';
  metadata: {
    totalOperations: number;
    totalConflicts: number;
    averageResponseTime: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const collaborationSessionSchema = new Schema<ICollaborationSession>(
  {
    workflowId: {
      type: String,
      required: true,
      ref: 'Workflow',
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    ownerId: {
      type: String,
      required: true,
      ref: 'User',
    },
    organizationId: {
      type: String,
      ref: 'Organization',
    },
    participants: [
      {
        userId: {
          type: String,
          required: true,
          ref: 'User',
        },
        socketId: {
          type: String,
          required: true,
        },
        userName: {
          type: String,
          required: true,
        },
        avatar: {
          type: String,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        lastSeen: {
          type: Date,
          default: Date.now,
        },
