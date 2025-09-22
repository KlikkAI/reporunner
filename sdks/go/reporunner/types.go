package reporunner

import (
	"encoding/json"
	"time"
)

// ExecutionStatus represents the status of a workflow execution
type ExecutionStatus string

const (
	ExecutionStatusPending   ExecutionStatus = "pending"
	ExecutionStatusRunning   ExecutionStatus = "running"
	ExecutionStatusCompleted ExecutionStatus = "completed"
	ExecutionStatusFailed    ExecutionStatus = "failed"
	ExecutionStatusCancelled ExecutionStatus = "cancelled"
	ExecutionStatusPaused    ExecutionStatus = "paused"
)

// WorkflowStatus represents the status of a workflow
type WorkflowStatus string

const (
	WorkflowStatusActive   WorkflowStatus = "active"
	WorkflowStatusInactive WorkflowStatus = "inactive"
	WorkflowStatusDraft    WorkflowStatus = "draft"
)

// CredentialType represents the type of credential
type CredentialType string

const (
	CredentialTypeAPIKey     CredentialType = "api_key"
	CredentialTypeOAuth2     CredentialType = "oauth2"
	CredentialTypeBasicAuth  CredentialType = "basic_auth"
	CredentialTypeBearerToken CredentialType = "bearer_token"
	CredentialTypeCustom     CredentialType = "custom"
)

// NodeType represents different types of workflow nodes
type NodeType string

const (
	NodeTypeTrigger    NodeType = "trigger"
	NodeTypeAction     NodeType = "action"
	NodeTypeCondition  NodeType = "condition"
	NodeTypeLoop       NodeType = "loop"
	NodeTypeTransform  NodeType = "transform"
	NodeTypeDelay      NodeType = "delay"
)

// Workflow represents a complete workflow definition
type Workflow struct {
	ID              string                 `json:"id"`
	Name            string                 `json:"name"`
	Description     string                 `json:"description,omitempty"`
	Status          WorkflowStatus         `json:"status"`
	Tags            []string               `json:"tags,omitempty"`
	Nodes           []WorkflowNode         `json:"nodes"`
	Edges           []WorkflowEdge         `json:"edges"`
	Settings        WorkflowSettings       `json:"settings"`
	Metadata        map[string]interface{} `json:"metadata,omitempty"`
	Version         int                    `json:"version"`
	CreatedAt       time.Time              `json:"created_at"`
	UpdatedAt       time.Time              `json:"updated_at"`
	CreatedBy       string                 `json:"created_by"`
	UpdatedBy       string                 `json:"updated_by"`
	OrganizationID  string                 `json:"organization_id,omitempty"`
}

// WorkflowNode represents a node in a workflow
type WorkflowNode struct {
	ID             string                 `json:"id"`
	Type           NodeType               `json:"type"`
	Name           string                 `json:"name"`
	IntegrationID  string                 `json:"integration_id,omitempty"`
	Operation      string                 `json:"operation,omitempty"`
	Parameters     map[string]interface{} `json:"parameters,omitempty"`
	Credentials    []string               `json:"credentials,omitempty"`
	Position       NodePosition           `json:"position"`
	Disabled       bool                   `json:"disabled"`
	Notes          string                 `json:"notes,omitempty"`
	ContinueOnFail bool                   `json:"continue_on_fail"`
	RetryOnFail    int                    `json:"retry_on_fail"`
	Timeout        int                    `json:"timeout,omitempty"`
}

// WorkflowEdge represents a connection between workflow nodes
type WorkflowEdge struct {
	ID       string            `json:"id"`
	Source   string            `json:"source"`
	Target   string            `json:"target"`
	Type     string            `json:"type,omitempty"`
	Animated bool              `json:"animated,omitempty"`
	Label    string            `json:"label,omitempty"`
	Data     map[string]interface{} `json:"data,omitempty"`
}

// NodePosition represents the position of a node in the workflow editor
type NodePosition struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

// WorkflowSettings contains workflow-level settings
type WorkflowSettings struct {
	Timezone          string `json:"timezone,omitempty"`
	MaxExecutionTime  int    `json:"max_execution_time,omitempty"`
	ErrorWorkflow     string `json:"error_workflow,omitempty"`
	SaveDataExecution string `json:"save_data_execution,omitempty"`
	CallerPolicy      string `json:"caller_policy,omitempty"`
}

// Execution represents a workflow execution
type Execution struct {
	ID              string                 `json:"id"`
	WorkflowID      string                 `json:"workflow_id"`
	WorkflowName    string                 `json:"workflow_name,omitempty"`
	Status          ExecutionStatus        `json:"status"`
	Mode            string                 `json:"mode,omitempty"`
	StartedAt       *time.Time             `json:"started_at,omitempty"`
	StoppedAt       *time.Time             `json:"stopped_at,omitempty"`
	Duration        int                    `json:"duration,omitempty"`
	Data            ExecutionData          `json:"data,omitempty"`
	Error           *ExecutionError        `json:"error,omitempty"`
	Progress        ExecutionProgress      `json:"progress"`
	Metadata        map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt       time.Time              `json:"created_at"`
	UpdatedAt       time.Time              `json:"updated_at"`
	CreatedBy       string                 `json:"created_by,omitempty"`
	OrganizationID  string                 `json:"organization_id,omitempty"`
}

// ExecutionData contains execution input/output data
type ExecutionData struct {
	Input  map[string]interface{} `json:"input,omitempty"`
	Output map[string]interface{} `json:"output,omitempty"`
	Nodes  map[string]NodeExecution `json:"nodes,omitempty"`
}

// NodeExecution contains execution data for a specific node
type NodeExecution struct {
	Status      ExecutionStatus        `json:"status"`
	StartTime   *time.Time             `json:"start_time,omitempty"`
	EndTime     *time.Time             `json:"end_time,omitempty"`
	Duration    int                    `json:"duration,omitempty"`
	InputData   map[string]interface{} `json:"input_data,omitempty"`
	OutputData  map[string]interface{} `json:"output_data,omitempty"`
	Error       *NodeError             `json:"error,omitempty"`
	RetryCount  int                    `json:"retry_count"`
}

// ExecutionProgress tracks execution progress
type ExecutionProgress struct {
	CompletedNodes int `json:"completed_nodes"`
	TotalNodes     int `json:"total_nodes"`
	FailedNodes    int `json:"failed_nodes"`
}

// ExecutionError contains error information for failed executions
type ExecutionError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	NodeID  string `json:"node_id,omitempty"`
	Details map[string]interface{} `json:"details,omitempty"`
}

// NodeError contains error information for failed nodes
type NodeError struct {
	Code      string                 `json:"code"`
	Message   string                 `json:"message"`
	Details   map[string]interface{} `json:"details,omitempty"`
	Timestamp time.Time              `json:"timestamp"`
}

// Credential represents an authentication credential
type Credential struct {
	ID             string                 `json:"id"`
	Name           string                 `json:"name"`
	Type           CredentialType         `json:"type"`
	Description    string                 `json:"description,omitempty"`
	Data           map[string]interface{} `json:"data,omitempty"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
	IsActive       bool                   `json:"is_active"`
	ExpiresAt      *time.Time             `json:"expires_at,omitempty"`
	LastUsed       *time.Time             `json:"last_used,omitempty"`
	CreatedAt      time.Time              `json:"created_at"`
	UpdatedAt      time.Time              `json:"updated_at"`
	CreatedBy      string                 `json:"created_by"`
	OrganizationID string                 `json:"organization_id,omitempty"`
}

// CredentialTest represents the result of credential testing
type CredentialTest struct {
	Success   bool                   `json:"success"`
	Message   string                 `json:"message,omitempty"`
	Details   map[string]interface{} `json:"details,omitempty"`
	TestedAt  time.Time              `json:"tested_at"`
}

// AIProvider represents an AI service provider
type AIProvider struct {
	ID           string                 `json:"id"`
	Name         string                 `json:"name"`
	Type         string                 `json:"type"`
	Description  string                 `json:"description,omitempty"`
	Models       []AIModel              `json:"models,omitempty"`
	Capabilities []string               `json:"capabilities,omitempty"`
	Config       map[string]interface{} `json:"config,omitempty"`
	IsAvailable  bool                   `json:"is_available"`
}

// AIModel represents an AI model
type AIModel struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	Description  string   `json:"description,omitempty"`
	Type         string   `json:"type"`
	Capabilities []string `json:"capabilities,omitempty"`
	MaxTokens    int      `json:"max_tokens,omitempty"`
	ContextSize  int      `json:"context_size,omitempty"`
	PriceInput   float64  `json:"price_input,omitempty"`
	PriceOutput  float64  `json:"price_output,omitempty"`
}

// LLMRequest represents a request for LLM completion
type LLMRequest struct {
	Provider     string                   `json:"provider"`
	Model        string                   `json:"model"`
	Messages     []LLMMessage             `json:"messages"`
	MaxTokens    *int                     `json:"max_tokens,omitempty"`
	Temperature  *float64                 `json:"temperature,omitempty"`
	Stream       bool                     `json:"stream,omitempty"`
	Functions    []LLMFunction            `json:"functions,omitempty"`
	FunctionCall interface{}              `json:"function_call,omitempty"`
	Stop         []string                 `json:"stop,omitempty"`
	User         string                   `json:"user,omitempty"`
}

// LLMMessage represents a message in LLM conversation
type LLMMessage struct {
	Role         string                 `json:"role"`
	Content      string                 `json:"content"`
	Name         string                 `json:"name,omitempty"`
	FunctionCall *LLMFunctionCall       `json:"function_call,omitempty"`
	ToolCalls    []LLMToolCall          `json:"tool_calls,omitempty"`
}

// LLMFunction represents a function that can be called by LLM
type LLMFunction struct {
	Name        string                 `json:"name"`
	Description string                 `json:"description,omitempty"`
	Parameters  map[string]interface{} `json:"parameters"`
}

// LLMFunctionCall represents a function call made by LLM
type LLMFunctionCall struct {
	Name      string `json:"name"`
	Arguments string `json:"arguments"`
}

// LLMToolCall represents a tool call made by LLM
type LLMToolCall struct {
	ID       string          `json:"id"`
	Type     string          `json:"type"`
	Function LLMFunctionCall `json:"function"`
}

// LLMResponse represents a response from LLM
type LLMResponse struct {
	ID                string             `json:"id"`
	Object            string             `json:"object"`
	Created           int64              `json:"created"`
	Model             string             `json:"model"`
	Choices           []LLMChoice        `json:"choices"`
	Usage             LLMUsage           `json:"usage"`
	SystemFingerprint string             `json:"system_fingerprint,omitempty"`
}

// LLMChoice represents a choice in LLM response
type LLMChoice struct {
	Index        int              `json:"index"`
	Message      *LLMMessage      `json:"message,omitempty"`
	Delta        *LLMMessage      `json:"delta,omitempty"`
	FinishReason string           `json:"finish_reason"`
	Logprobs     *LLMLogprobs     `json:"logprobs,omitempty"`
}

// LLMUsage represents token usage in LLM response
type LLMUsage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

// LLMLogprobs represents log probabilities in LLM response
type LLMLogprobs struct {
	Tokens        []string             `json:"tokens,omitempty"`
	TokenLogprobs []float64            `json:"token_logprobs,omitempty"`
	TopLogprobs   []map[string]float64 `json:"top_logprobs,omitempty"`
}

// EmbeddingRequest represents a request for text embeddings
type EmbeddingRequest struct {
	Provider   string   `json:"provider"`
	Model      string   `json:"model"`
	Input      []string `json:"input"`
	Dimensions *int     `json:"dimensions,omitempty"`
	User       string   `json:"user,omitempty"`
}

// EmbeddingResponse represents a response with embeddings
type EmbeddingResponse struct {
	Object string      `json:"object"`
	Data   []Embedding `json:"data"`
	Model  string      `json:"model"`
	Usage  LLMUsage    `json:"usage"`
}

// Embedding represents a single embedding
type Embedding struct {
	Object    string    `json:"object"`
	Embedding []float64 `json:"embedding"`
	Index     int       `json:"index"`
}

// VectorSearchRequest represents a vector search request
type VectorSearchRequest struct {
	Collection          string                 `json:"collection"`
	QueryVector         []float64              `json:"query_vector"`
	Limit               int                    `json:"limit"`
	Filter              map[string]interface{} `json:"filter,omitempty"`
	IncludeMetadata     bool                   `json:"include_metadata"`
	SimilarityThreshold *float64               `json:"similarity_threshold,omitempty"`
}

// VectorSearchResult represents a vector search result
type VectorSearchResult struct {
	ID        string                 `json:"id"`
	Score     float64                `json:"score"`
	Vector    []float64              `json:"vector,omitempty"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
}

// AIAgent represents an AI agent configuration
type AIAgent struct {
	ID           string                 `json:"id"`
	Name         string                 `json:"name"`
	Description  string                 `json:"description,omitempty"`
	SystemPrompt string                 `json:"system_prompt"`
	Provider     string                 `json:"provider"`
	Model        string                 `json:"model"`
	Tools        []AITool               `json:"tools,omitempty"`
	MemoryConfig map[string]interface{} `json:"memory_config,omitempty"`
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
	IsActive     bool                   `json:"is_active"`
	CreatedAt    time.Time              `json:"created_at"`
	UpdatedAt    time.Time              `json:"updated_at"`
	CreatedBy    string                 `json:"created_by"`
}

// AITool represents a tool that an AI agent can use
type AITool struct {
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Schema      map[string]interface{} `json:"schema"`
	Handler     string                 `json:"handler"`
}

// WebSocketMessage represents a WebSocket message
type WebSocketMessage struct {
	Type      string                 `json:"type"`
	Event     string                 `json:"event,omitempty"`
	Data      map[string]interface{} `json:"data,omitempty"`
	Timestamp time.Time              `json:"timestamp"`
	RequestID string                 `json:"request_id,omitempty"`
}

// FilterParams represents common filtering parameters
type FilterParams struct {
	Search    string            `json:"search,omitempty"`
	Tags      []string          `json:"tags,omitempty"`
	Status    string            `json:"status,omitempty"`
	DateRange *DateRange        `json:"date_range,omitempty"`
	Metadata  map[string]string `json:"metadata,omitempty"`
}

// DateRange represents a date range filter
type DateRange struct {
	Start *time.Time `json:"start,omitempty"`
	End   *time.Time `json:"end,omitempty"`
}

// SortParams represents sorting parameters
type SortParams struct {
	Field string `json:"field"`
	Order string `json:"order"` // "asc" or "desc"
}

// ListParams combines pagination, filtering, and sorting parameters
type ListParams struct {
	Pagination *PaginationParams `json:"pagination,omitempty"`
	Filter     *FilterParams     `json:"filter,omitempty"`
	Sort       []SortParams      `json:"sort,omitempty"`
}

// Statistics represents general statistics
type Statistics struct {
	Total      int            `json:"total"`
	Active     int            `json:"active"`
	Inactive   int            `json:"inactive"`
	Failed     int            `json:"failed,omitempty"`
	Success    int            `json:"success,omitempty"`
	Percentage map[string]float64 `json:"percentage,omitempty"`
	Trend      map[string]interface{} `json:"trend,omitempty"`
}

// HealthStatus represents system health status
type HealthStatus struct {
	Status    string                     `json:"status"`
	Version   string                     `json:"version"`
	Timestamp time.Time                  `json:"timestamp"`
	Services  map[string]ServiceHealth   `json:"services"`
	Metrics   map[string]interface{}     `json:"metrics,omitempty"`
}

// ServiceHealth represents the health of a specific service
type ServiceHealth struct {
	Status      string                 `json:"status"`
	Message     string                 `json:"message,omitempty"`
	LastChecked time.Time              `json:"last_checked"`
	Metrics     map[string]interface{} `json:"metrics,omitempty"`
}

// BatchOperation represents a batch operation request
type BatchOperation struct {
	Operation string                   `json:"operation"`
	Targets   []string                 `json:"targets"`
	Options   map[string]interface{}   `json:"options,omitempty"`
}

// BatchResult represents the result of a batch operation
type BatchResult struct {
	Total     int                      `json:"total"`
	Succeeded int                      `json:"succeeded"`
	Failed    int                      `json:"failed"`
	Results   []BatchOperationResult   `json:"results"`
}

// BatchOperationResult represents the result of a single operation in a batch
type BatchOperationResult struct {
	Target  string      `json:"target"`
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}