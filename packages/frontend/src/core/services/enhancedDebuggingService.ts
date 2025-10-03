/**
 * Enhanced Debugging Service - Stub
 * This service was removed during consolidation.
 * Minimal types provided for backward compatibility.
 */

export interface DebugSession {
  id: string;
  workflowId: string;
  status: 'active' | 'paused' | 'stopped';
  breakpoints: string[];
}

// Stub service class
class EnhancedDebuggingService {
  async startDebugSession(_workflowId: string): Promise<DebugSession> {
    return {
      id: 'stub',
      workflowId: _workflowId,
      status: 'stopped',
      breakpoints: [],
    };
  }
}

export const enhancedDebuggingService = new EnhancedDebuggingService();
