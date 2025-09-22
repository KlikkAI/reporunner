use crate::{Error, Result};
use crate::models::*;
use crate::websocket::WebSocketStream;
use reqwest::{Client as HttpClient, RequestBuilder};
use serde::de::DeserializeOwned;
use std::collections::HashMap;
use std::time::Duration;
use tokio::time::{sleep, timeout};
use tracing::{debug, error, info, warn};

/// Reporunner API client
#[derive(Clone)]
pub struct Client {
    http_client: HttpClient,
    base_url: String,
    api_key: Option<String>,
}

impl Client {
    /// Create a new client with the specified base URL
    pub fn new(base_url: impl Into<String>) -> Self {
        let http_client = HttpClient::builder()
            .timeout(crate::DEFAULT_TIMEOUT)
            .build()
            .expect("Failed to create HTTP client");

        Self {
            http_client,
            base_url: base_url.into(),
            api_key: None,
        }
    }

    /// Set the API key for authentication
    pub fn with_api_key(mut self, api_key: impl Into<String>) -> Self {
        self.api_key = Some(api_key.into());
        self
    }

    /// Set a custom timeout for requests
    pub fn with_timeout(mut self, timeout: Duration) -> Result<Self> {
        self.http_client = HttpClient::builder()
            .timeout(timeout)
            .build()
            .map_err(|e| Error::Http(e.to_string()))?;
        Ok(self)
    }

    /// Create a new workflow
    pub async fn create_workflow(
        &self,
        request: CreateWorkflowRequest,
    ) -> Result<WorkflowDefinition> {
        info!("Creating workflow: {}", request.name);
        let workflow: WorkflowDefinition = self
            .make_request("POST", "/api/workflows", Some(&request))
            .await?;
        debug!("Created workflow with ID: {}", workflow.id);
        Ok(workflow)
    }

    /// Get a workflow by ID
    pub async fn get_workflow(&self, workflow_id: &str) -> Result<WorkflowDefinition> {
        debug!("Getting workflow: {}", workflow_id);
        let path = format!("/api/workflows/{}", workflow_id);
        self.make_request("GET", &path, None::<&()>).await
    }

    /// List workflows with optional filters
    pub async fn list_workflows(
        &self,
        options: Option<ListWorkflowsOptions>,
    ) -> Result<Vec<WorkflowDefinition>> {
        debug!("Listing workflows with options: {:?}", options);
        
        let mut path = "/api/workflows".to_string();
        if let Some(opts) = options {
            let mut params = Vec::new();
            
            if let Some(limit) = opts.limit {
                params.push(format!("limit={}", limit));
            }
            if let Some(offset) = opts.offset {
                params.push(format!("offset={}", offset));
            }
            if opts.active_only {
                params.push("active=true".to_string());
            }
            
            if !params.is_empty() {
                path.push('?');
                path.push_str(&params.join("&"));
            }
        }

        #[derive(serde::Deserialize)]
        struct Response {
            workflows: Vec<WorkflowDefinition>,
        }

        let response: Response = self.make_request("GET", &path, None::<&()>).await?;
        Ok(response.workflows)
    }

    /// Execute a workflow
    pub async fn execute_workflow(
        &self,
        workflow_id: &str,
        input_data: HashMap<String, serde_json::Value>,
        wait_for_completion: bool,
    ) -> Result<ExecutionResult> {
        info!("Executing workflow: {}", workflow_id);
        
        let request = ExecuteWorkflowRequest {
            workflow_id: workflow_id.to_string(),
            input_data,
        };

        let mut execution: ExecutionResult = self
            .make_request("POST", "/api/executions", Some(&request))
            .await?;

        if wait_for_completion {
            debug!("Waiting for execution completion: {}", execution.id);
            execution = self.wait_for_execution(&execution.id).await?;
        }

        Ok(execution)
    }

    /// Get execution result by ID
    pub async fn get_execution(&self, execution_id: &str) -> Result<ExecutionResult> {
        debug!("Getting execution: {}", execution_id);
        let path = format!("/api/executions/{}", execution_id);
        self.make_request("GET", &path, None::<&()>).await
    }

    /// Cancel a running execution
    pub async fn cancel_execution(&self, execution_id: &str) -> Result<()> {
        info!("Cancelling execution: {}", execution_id);
        let path = format!("/api/executions/{}/cancel", execution_id);
        self.make_request("POST", &path, None::<&()>).await?;
        Ok(())
    }

    /// Stream real-time execution updates via WebSocket
    pub async fn stream_execution(
        &self,
        execution_id: &str,
    ) -> Result<WebSocketStream> {
        info!("Starting execution stream for: {}", execution_id);
        
        let ws_url = format!(
            "{}/ws/execution/{}",
            self.base_url.replace("http", "ws"),
            execution_id
        );

        let mut headers = vec![];
        if let Some(api_key) = &self.api_key {
            headers.push(("Authorization".to_string(), format!("Bearer {}", api_key)));
        }

        WebSocketStream::connect(&ws_url, headers).await
    }

    /// Update a workflow
    pub async fn update_workflow(
        &self,
        workflow_id: &str,
        request: UpdateWorkflowRequest,
    ) -> Result<WorkflowDefinition> {
        info!("Updating workflow: {}", workflow_id);
        let path = format!("/api/workflows/{}", workflow_id);
        self.make_request("PUT", &path, Some(&request)).await
    }

    /// Delete a workflow
    pub async fn delete_workflow(&self, workflow_id: &str) -> Result<()> {
        info!("Deleting workflow: {}", workflow_id);
        let path = format!("/api/workflows/{}", workflow_id);
        self.make_request("DELETE", &path, None::<&()>).await?;
        Ok(())
    }

    /// Get workflow execution history
    pub async fn get_execution_history(
        &self,
        workflow_id: &str,
        options: Option<ExecutionHistoryOptions>,
    ) -> Result<Vec<ExecutionResult>> {
        debug!("Getting execution history for workflow: {}", workflow_id);
        
        let mut path = format!("/api/workflows/{}/executions", workflow_id);
        if let Some(opts) = options {
            let mut params = Vec::new();
            
            if let Some(limit) = opts.limit {
                params.push(format!("limit={}", limit));
            }
            if let Some(offset) = opts.offset {
                params.push(format!("offset={}", offset));
            }
            if let Some(status) = opts.status {
                params.push(format!("status={}", status.as_str()));
            }
            
            if !params.is_empty() {
                path.push('?');
                path.push_str(&params.join("&"));
            }
        }

        #[derive(serde::Deserialize)]
        struct Response {
            executions: Vec<ExecutionResult>,
        }

        let response: Response = self.make_request("GET", &path, None::<&()>).await?;
        Ok(response.executions)
    }

    /// Wait for execution completion with polling
    async fn wait_for_execution(&self, execution_id: &str) -> Result<ExecutionResult> {
        let polling_interval = Duration::from_secs(1);
        let max_wait_time = Duration::from_secs(300); // 5 minutes

        timeout(max_wait_time, async {
            loop {
                let execution = self.get_execution(execution_id).await?;
                
                match execution.status {
                    ExecutionStatus::Success | 
                    ExecutionStatus::Error | 
                    ExecutionStatus::Cancelled => {
                        return Ok(execution);
                    }
                    ExecutionStatus::Pending | ExecutionStatus::Running => {
                        debug!("Execution {} still running, waiting...", execution_id);
                        sleep(polling_interval).await;
                    }
                }
            }
        })
        .await
        .map_err(|_| Error::Timeout("Execution wait timeout".to_string()))?
    }

    /// Make an HTTP request to the API
    async fn make_request<T, B>(
        &self,
        method: &str,
        path: &str,
        body: Option<&B>,
    ) -> Result<T>
    where
        T: DeserializeOwned,
        B: serde::Serialize,
    {
        let url = format!("{}{}", self.base_url, path);
        debug!("Making {} request to: {}", method, url);

        let mut request = match method {
            "GET" => self.http_client.get(&url),
            "POST" => self.http_client.post(&url),
            "PUT" => self.http_client.put(&url),
            "DELETE" => self.http_client.delete(&url),
            _ => return Err(Error::InvalidMethod(method.to_string())),
        };

        request = request.header("Content-Type", "application/json");

        if let Some(api_key) = &self.api_key {
            request = request.header("Authorization", format!("Bearer {}", api_key));
        }

        if let Some(body) = body {
            request = request.json(body);
        }

        let response = request.send().await.map_err(|e| {
            error!("HTTP request failed: {}", e);
            Error::Http(e.to_string())
        })?;

        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_default();
            error!("API request failed with status {}: {}", status, error_text);
            return Err(Error::Api {
                status: status.as_u16(),
                message: error_text,
            });
        }

        response.json().await.map_err(|e| {
            error!("Failed to parse response JSON: {}", e);
            Error::Serialization(e.to_string())
        })
    }
}