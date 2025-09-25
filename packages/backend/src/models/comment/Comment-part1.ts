/**
 * Comment Model for workflow collaboration
 * Supports threaded discussions and annotations
 */

import mongoose, { type Document, Schema } from 'mongoose';

export interface IComment extends Document {
  _id: string;
  workflowId: string;
  sessionId?: string;
  authorId: string;
  parentCommentId?: string; // For threaded replies
  content: string;
  mentions: Array<{
    userId: string;
    userName: string;
    startIndex: number;
    endIndex: number;
  }>;
  attachments: Array<{
    type: 'image' | 'file' | 'link';
    url: string;
    name: string;
    size?: number;
    mimeType?: string;
  }>;
  position?: {
    x: number;
    y: number;
    nodeId?: string;
    edgeId?: string;
  };
  status: 'open' | 'resolved' | 'closed';
  reactions: Array<{
    userId: string;
    type: '👍' | '👎' | '❤️' | '😂' | '😮' | '😢' | '😡';
    timestamp: Date;
  }>;
  thread: Array<{
    authorId: string;
    content: string;
    timestamp: Date;
    edited?: Date;
    mentions?: Array<{
      userId: string;
      userName: string;
      startIndex: number;
      endIndex: number;
    }>;
  }>;
  visibility: 'public' | 'private' | 'team';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  resolvedBy?: string;
  resolvedAt?: Date;
  editHistory: Array<{
    timestamp: Date;
    previousContent: string;
    editedBy: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    workflowId: {
      type: String,
      required: true,
      ref: 'Workflow',
    },
    sessionId: {
      type: String,
      ref: 'CollaborationSession',
    },
    authorId: {
      type: String,
      required: true,
      ref: 'User',
    },
    parentCommentId: {
      type: String,
      ref: 'Comment',
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    mentions: [
      {
        userId: {
          type: String,
          required: true,
          ref: 'User',
        },
        userName: {
          type: String,
          required: true,
