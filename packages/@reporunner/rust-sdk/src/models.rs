use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Workflow definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowDefinition {
    pub id: String,
    pub name: String,
    pub description: String,
    pub active: bool,
    pub nodes: Vec<NodeDefinition>,
    pub connections: Vec<Connection>,
    pub settings: HashMap<String, serde_json::Value>,
    #[serde(rename = "createdAt")]
    pub created_at: DateTime<Utc>,
    #[serde(rename = "updatedAt")]
    pub updated_at: DateTime<Utc>,
}

/// Node definition in a workflow
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeDefinition {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub node_type: String,
    pub position: Position,
    pub parameters: HashMap<String, serde_json::Value>,
}

/// Node position in the workflow canvas
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub x: f64,
    pub y: f64,
}

/// Connection between nodes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Connection {
    pub source: ConnectionPoint,
    pub destination: ConnectionPoint,
}

/// Connection endpoint
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionPoint {
    #[serde(rename = "nodeId")]
    pub node_id: String,
    #[serde(rename = "outputIndex", skip_serializing_if = "Option::is_none")]
    pub output_index: Option<usize>,
    #[serde(rename = "inputIndex", skip_serializing_if = "Option::is_none")]
    pub input_index: Option<usize>,
}

/// Execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionResult {
    pub id: String,
    #[serde(rename = "workflowId")]
    pub workflow_id: String,
    pub status: ExecutionStatus,
    #[serde(rename = "startedAt")]
    pub started_at: DateTime<Utc>,
    #[serde(rename = "finishedAt")]
    pub finished_at: Option<DateTime<Utc>>,
    #[serde(rename = "inputData")]
    pub input_data: HashMap<String, serde_json::Value>,
    #[serde(rename = "outputData")]
    pub output_data: HashMap<String, serde_json::Value>,
    pub error: Option<String>,
    #[serde(rename = "nodeResults")]
    pub node_results: HashMap<String, serde_json::Value>,
    pub metadata: ExecutionMetadata,
}

/// Execution status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ExecutionStatus {
    Pending,
    Running,
    Success,
    Error,
    Cancelled,
}

impl ExecutionStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            ExecutionStatus::Pending => "pending",
            ExecutionStatus::Running => "running",
            ExecutionStatus::Success => "success",
            ExecutionStatus::Error => "error",
            ExecutionStatus::Cancelled => "cancelled",
        }
    }
}

/// Execution metadata and statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionMetadata {
    #[serde(rename = "totalNodes")]
    pub total_nodes: usize,
    #[serde(rename = "completedNodes")]
    pub completed_nodes: usize,
    #[serde(rename = "failedNodes")]
    pub failed_nodes: usize,
    #[serde(rename = "retriedNodes")]
    pub retried_nodes: usize,
}

/// Request to create a workflow
#[derive(Debug, Clone, Serialize)]
pub struct CreateWorkflowRequest {
    pub name: String,
    pub description: String,
    pub nodes: Vec<NodeDefinition>,
    pub connections: Vec<Connection>,
    pub settings: Option<HashMap<String, serde_json::Value>>,
}

/// Request to update a workflow
#[derive(Debug, Clone, Serialize)]
pub struct UpdateWorkflowRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub active: Option<bool>,
    pub nodes: Option<Vec<NodeDefinition>>,
    pub connections: Option<Vec<Connection>>,
    pub settings: Option<HashMap<String, serde_json::Value>>,
}

/// Request to execute a workflow
#[derive(Debug, Clone, Serialize)]
pub struct ExecuteWorkflowRequest {
    #[serde(rename = "workflowId")]
    pub workflow_id: String,
    #[serde(rename = "inputData")]
    pub input_data: HashMap<String, serde_json::Value>,
}

/// Options for listing workflows
#[derive(Debug, Clone)]
pub struct ListWorkflowsOptions {
    pub limit: Option<usize>,
    pub offset: Option<usize>,
    pub active_only: bool,
}

impl Default for ListWorkflowsOptions {
    fn default() -> Self {
        Self {
            limit: None,
            offset: None,
            active_only: false,
        }
    }
}

/// Options for getting execution history
#[derive(Debug, Clone)]
pub struct ExecutionHistoryOptions {
    pub limit: Option<usize>,
    pub offset: Option<usize>,
    pub status: Option<ExecutionStatus>,
}

impl Default for ExecutionHistoryOptions {
    fn default() -> Self {
        Self {
            limit: None,
            offset: None,
            status: None,
        }
    }
}

/// WebSocket update message
#[derive(Debug, Clone, Deserialize)]
pub struct ExecutionUpdate {
    #[serde(rename = "type")]
    pub update_type: String,
    pub data: serde_json::Value,
    pub timestamp: DateTime<Utc>,
}