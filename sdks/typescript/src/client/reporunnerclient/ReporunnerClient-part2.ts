await this.http.delete(`/api/workflows/${id}`);
}

  // Workflow Execution
  async executeWorkflow(id: string, input?: Record<string, any>): Promise<ExecutionResult>
{
  const response = await this.http.post<ApiResponse<ExecutionResult>>(
    `/api/workflows/${id}/execute`,
    { input }
  );
  if (!response.data.data) {
    throw new Error(`Failed to execute workflow ${id}`);
  }
  return response.data.data;
}

async;
getExecution(id: string)
: Promise<ExecutionResult>
{
  const response = await this.http.get<ApiResponse<ExecutionResult>>(`/api/executions/${id}`);
  if (!response.data.data) {
    throw new Error(`Execution ${id} not found`);
  }
  return response.data.data;
}

async;
getExecutions(workflowId?: string)
: Promise<ExecutionResult[]>
{
  const params = workflowId ? { workflowId } : {};
  const response = await this.http.get<ApiResponse<ExecutionResult[]>>('/api/executions', {
    params,
  });
  return response.data.data || [];
}

async;
cancelExecution(id: string)
: Promise<void>
{
  await this.http.post(`/api/executions/${id}/cancel`);
}

// Credential Management
async;
getCredentials();
: Promise<any[]>
{
  const response = await this.http.get<ApiResponse<any[]>>('/api/credentials');
  return response.data.data || [];
}

async;
createCredential(credential: any)
: Promise<any>
{
  const response = await this.http.post<ApiResponse<any>>('/api/credentials', credential);
  if (!response.data.data) {
    throw new Error('Failed to create credential');
  }
  return response.data.data;
}

async;
updateCredential(id: string, credential: any)
: Promise<any>
{
  const response = await this.http.put<ApiResponse<any>>(`/api/credentials/${id}`, credential);
  if (!response.data.data) {
    throw new Error(`Failed to update credential ${id}`);
  }
  return response.data.data;
}

async;
deleteCredential(id: string)
: Promise<void>
{
  await this.http.delete(`/api/credentials/${id}`);
}

async;
testCredential(id: string)
: Promise<boolean>
{
  try {
    await this.http.post(`/api/credentials/${id}/test`);
    return true;
  } catch {
    return false;
  }
}

// WebSocket Methods
onExecutionUpdate(callback: (_execution: ExecutionResult) => void)
: void
{
  if (!this.ws) {
    throw new Error('WebSocket is not enabled. Set enableWebSocket: true in config.');
  }
  this.ws.on('execution:update', callback);
}

onWorkflowUpdate(callback: (_workflow: WorkflowDefinition) => void)
: void
{
  if (!this.ws) {
    throw new Error('WebSocket is not enabled. Set enableWebSocket: true in config.');
  }
  this.ws.on('workflow:update', callback);
}

// Utility Methods
async;
ping();
: Promise<boolean>
{
  try {
    await this.http.get('/api/health');
    return true;
  } catch {
    return false;
  }
}

async;
getVersion();
: Promise<string>
{
  const response = await this.http.get<ApiResponse<{ version: string }>>('/api/version');
  return response.data.data?.version || 'unknown';
}
