import type { ApiResponse, WorkflowDefinition } from '@reporunner/core';
import axios, { type AxiosInstance } from 'axios';
import { WebSocketClient } from './WebSocketClient.js';

export interface ReporunnerClientConfig {
  apiUrl?: string;
  apiKey?: string;
  timeout?: number;
  enableWebSocket?: boolean;
  wsUrl?: string;
}

export interface ExecutionResult {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  duration?: number;
  error?: string;
  result?: unknown;
}

export interface Credential {
  id: string;
  name: string;
  type: string;
  data: Record<string, unknown>;
  userId?: string;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class ReporunnerClient {
  private http: AxiosInstance;
  private config: Required<ReporunnerClientConfig>;
  private ws?: WebSocketClient;

  constructor(config: ReporunnerClientConfig = {}) {
    this.config = {
      apiUrl: config.apiUrl || 'http://localhost:5000',
      apiKey: config.apiKey || '',
      timeout: config.timeout || 30000,
      enableWebSocket: config.enableWebSocket ?? false,
      wsUrl: config.wsUrl || 'ws://localhost:5000',
    };

    this.http = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && {
          Authorization: `Bearer ${this.config.apiKey}`,
        }),
      },
    });

    // Request interceptor for logging
    this.http.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.http.interceptors.response.use(
      (response) => response,
      (error) => {
        return Promise.reject(error);
      }
    );

    if (this.config.enableWebSocket) {
      this.ws = new WebSocketClient(this.config.wsUrl, this.config.apiKey);
    }
  }

  // Workflow Management
  async getWorkflows(): Promise<WorkflowDefinition[]> {
    const response = await this.http.get<ApiResponse<WorkflowDefinition[]>>('/api/workflows');
    return response.data.data || [];
  }

  async getWorkflow(id: string): Promise<WorkflowDefinition> {
    const response = await this.http.get<ApiResponse<WorkflowDefinition>>(`/api/workflows/${id}`);
    if (!response.data.data) {
      throw new Error(`Workflow ${id} not found`);
    }
    return response.data.data;
  }

  async createWorkflow(
    workflow: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<WorkflowDefinition> {
    const response = await this.http.post<ApiResponse<WorkflowDefinition>>(
      '/api/workflows',
      workflow
    );
    if (!response.data.data) {
      throw new Error('Failed to create workflow');
    }
    return response.data.data;
  }

  async updateWorkflow(
    id: string,
    workflow: Partial<WorkflowDefinition>
  ): Promise<WorkflowDefinition> {
    const response = await this.http.put<ApiResponse<WorkflowDefinition>>(
      `/api/workflows/${id}`,
      workflow
    );
    if (!response.data.data) {
      throw new Error(`Failed to update workflow ${id}`);
    }
    return response.data.data;
  }

  async deleteWorkflow(id: string): Promise<void> {
    await this.http.delete(`/api/workflows/${id}`);
  }

  // Workflow Execution
  async executeWorkflow(id: string, input?: Record<string, unknown>): Promise<ExecutionResult> {
    const response = await this.http.post<ApiResponse<ExecutionResult>>(
      `/api/workflows/${id}/execute`,
      { input }
    );
    if (!response.data.data) {
      throw new Error(`Failed to execute workflow ${id}`);
    }
    return response.data.data;
  }

  async getExecution(id: string): Promise<ExecutionResult> {
    const response = await this.http.get<ApiResponse<ExecutionResult>>(`/api/executions/${id}`);
    if (!response.data.data) {
      throw new Error(`Execution ${id} not found`);
    }
    return response.data.data;
  }

  async getExecutions(workflowId?: string): Promise<ExecutionResult[]> {
    const params = workflowId ? { workflowId } : {};
    const response = await this.http.get<ApiResponse<ExecutionResult[]>>('/api/executions', {
      params,
    });
    return response.data.data || [];
  }

  async cancelExecution(id: string): Promise<void> {
    await this.http.post(`/api/executions/${id}/cancel`);
  }

  // Credential Management
  async getCredentials(): Promise<Credential[]> {
    const response = await this.http.get<ApiResponse<Credential[]>>('/api/credentials');
    return response.data.data || [];
  }

  async createCredential(credential: Partial<Credential>): Promise<Credential> {
    const response = await this.http.post<ApiResponse<Credential>>('/api/credentials', credential);
    if (!response.data.data) {
      throw new Error('Failed to create credential');
    }
    return response.data.data;
  }

  async updateCredential(id: string, credential: Partial<Credential>): Promise<Credential> {
    const response = await this.http.put<ApiResponse<Credential>>(
      `/api/credentials/${id}`,
      credential
    );
    if (!response.data.data) {
      throw new Error(`Failed to update credential ${id}`);
    }
    return response.data.data;
  }

  async deleteCredential(id: string): Promise<void> {
    await this.http.delete(`/api/credentials/${id}`);
  }

  async testCredential(id: string): Promise<boolean> {
    try {
      await this.http.post(`/api/credentials/${id}/test`);
      return true;
    } catch {
      return false;
    }
  }

  // WebSocket Methods
  onExecutionUpdate(callback: (_execution: ExecutionResult) => void): void {
    if (!this.ws) {
      throw new Error('WebSocket is not enabled. Set enableWebSocket: true in config.');
    }
    this.ws.on('execution:update', callback);
  }

  onWorkflowUpdate(callback: (_workflow: WorkflowDefinition) => void): void {
    if (!this.ws) {
      throw new Error('WebSocket is not enabled. Set enableWebSocket: true in config.');
    }
    this.ws.on('workflow:update', callback);
  }

  // Utility Methods
  async ping(): Promise<boolean> {
    try {
      await this.http.get('/api/health');
      return true;
    } catch {
      return false;
    }
  }

  async getVersion(): Promise<string> {
    const response = await this.http.get<ApiResponse<{ version: string }>>('/api/version');
    return response.data.data?.version || 'unknown';
  }

  // Cleanup
  disconnect(): void {
    this.ws?.disconnect();
  }
}
