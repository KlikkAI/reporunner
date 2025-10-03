/**
 * Collaboration Service - Stub
 * This service was removed during consolidation.
 * Minimal types provided for backward compatibility.
 */

export interface UserPresence {
  userId: string;
  userName: string;
  color: string;
  cursor?: { x: number; y: number };
  selectedNodeId?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
  nodeId?: string;
  resolved?: boolean;
}

// Stub service class
class CollaborationService {
  async getUserPresence(): Promise<UserPresence[]> {
    return [];
  }

  async getComments(): Promise<Comment[]> {
    return [];
  }

  async addComment(_comment: Partial<Comment>): Promise<Comment> {
    return {
      id: 'stub',
      userId: 'stub',
      userName: 'Stub User',
      content: '',
      timestamp: new Date().toISOString(),
    };
  }
}

export const collaborationService = new CollaborationService();
