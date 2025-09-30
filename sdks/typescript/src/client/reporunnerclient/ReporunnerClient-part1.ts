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

export class ReporunnerClient {
  private http: AxiosInstance;
  private config: Required<ReporunnerClientConfig>;

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

  async deleteWorkflow(_id: string): Promise<void> {
