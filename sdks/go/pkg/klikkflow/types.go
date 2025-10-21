package klikkflow

import (
	"encoding/json"
	"time"
)

// Core types for the KlikkFlow Go SDK

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
	WorkflowStatusError    WorkflowStatus = "error"
)

// PropertyType represents the type of a node property
type PropertyType string

const (
	PropertyTypeString           PropertyType = "string"
	PropertyTypeNumber           PropertyType = "number"
	PropertyTypeBoolean          PropertyType = "boolean"
	PropertyTypeSelect           PropertyType = "select"
	PropertyTypeMultiSelect      PropertyType = "multiSelect"
	PropertyTypeCredentialsSelect PropertyType = "credentialsSelect"
	PropertyTypeJSON             PropertyType = "json"
	PropertyTypeExpression       PropertyType = "expression"
	PropertyTypeText             PropertyType = "text"
	PropertyTypeDateTime         PropertyType = "dateTime"
	PropertyTypeColor            PropertyType = "color"
	PropertyTypeFile             PropertyType = "file"
	PropertyTypeCollection       PropertyType = "collection"
	PropertyTypeFixedCollection  PropertyType = "fixedCollection"
	PropertyTypeResourceLocator  PropertyType = "resourceLocator"
	PropertyTypeResourceMapper   PropertyType = "resourceMapper"
	PropertyTypeCode             PropertyType = "code"
	PropertyTypeHidden           PropertyType = "hidden"
	PropertyTypeNotice           PropertyType = "notice"
	PropertyTypeButton           PropertyType = "button"
	PropertyTypeOptions          PropertyType = "options"
)

// NodeProperty represents a property of a node
type NodeProperty struct {
	Name                string                 `json:"name"`
	DisplayName         string                 `json:"displayName"`
	Type                PropertyType           `json:"type"`
	Default             interface{}            `json:"default,omitempty"`
	Description         string                 `json:"description,omitempty"`
	Required            bool                   `json:"required,omitempty"`
	Options             []PropertyOption       `json:"options,omitempty"`
	DisplayOptions      *DisplayOptions        `json:"displayOptions,omitempty"`
	Placeholder         string                 `json:"placeholder,omitempty"`
	TypeOptions         map[string]interface{} `json:"typeOptions,omitempty"`
	ExtractValue        map[string]interface{} `json:"extractValue,omitempty"`
	Hint                string                 `json:"hint,omitempty"`
	NoDataExpression    bool                   `json:"noDataExpression,omitempty"`
	RequiredIf          map[string]interface{} `json:"requiredIf,omitempty"`
	CredentialTypes     []string               `json:"credentialTypes,omitempty"`
	LoadOptionsMethod   string                 `json:"loadOptionsMethod,omitempty"`
	LoadOptionsDependsOn []string              `json:"loadOptionsDependsOn,omitempty"`
	Routing             map[string]interface{} `json:"routing,omitempty"`
}

// PropertyOption represents an option for a select property
type PropertyOption struct {
	Name        string      `json:"name"`
	Value       interface{} `json:"value"`
	Description string      `json:"description,omitempty"`
	Action      string      `json:"action,omitempty"`
	Routing     interface{} `json:"routing,omitempty"`
}

// DisplayOptions controls when properties are shown or hidden
type DisplayOptions struct {
	Show   map[string][]interface{} `json:"show,omitempty"`
	Hide   map[string][]interface{} `json:"hide,omitempty"`
	ShowIf string                   `json:"showIf,omitempty"`
	HideIf string                   `json:"hideIf,omitempty"`
}

// Workflow represents a workflow definition
type Workflow struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	Description string                 `json:"description,omitempty"`
	Active      bool                   `json:"active"`
	Status      WorkflowStatus         `json:"status"`
	Nodes       []WorkflowNode         `json:"nodes"`
	Connections []WorkflowConnection   `json:"connections"`
	Settings    map[string]interface{} `json:"settings,omitempty"`
	Tags        []string               `json:"tags,omitempty"`
	CreatedAt   time.Time              `json:"createdAt"`
	UpdatedAt   time.Time              `json:"updatedAt"`
	CreatedBy   string                 `json:"createdBy,omitempty"`
	UpdatedBy   string                 `json:"updatedBy,omitempty"`
	Version     int                    `json:"version,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// WorkflowNode represents a node in a workflow
type WorkflowNode struct {
	ID           string                 `json:"id"`
	Name         string                 `json:"name"`
	Type         string                 `json:"type"`
	TypeVersion  float64                `json:"typeVersion,omitempty"`
	Position     NodePosition           `json:"position"`
	Parameters   map[string]interface{} `json:"parameters,omitempty"`
	Credentials  map[string]interface{} `json:"credentials,omitempty"`
	Disabled     bool                   `json:"disabled,omitempty"`
	Notes        string                 `json:"notes,omitempty"`
	Color        string                 `json:"color,omitempty"`
	OnError      string                 `json:"onError,omitempty"`
	RetryOnFail  bool                   `json:"retryOnFail,omitempty"`
	MaxTries     int                    `json:"maxTries,omitempty"`
	WaitBetween  int                    `json:"waitBetween,omitempty"`
	AlwaysOutput bool                   `json:"alwaysOutput,omitempty"`
	Webhooks     []WebhookConfig        `json:"webhooks,omitempty"`
}

// NodePosition represents the position of a node in the workflow canvas
type NodePosition struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

// WorkflowConnection represents a connection between nodes
type WorkflowConnection struct {
	Node         string `json:"node"`
	Type         string `json:"type"`
	Index        int    `json:"index"`
	SourceOutput string `json:"sourceOutput,omitempty"`
	TargetInput  string `json:"targetInput,omitempty"`
}

// WebhookConfig represents webhook configuration for a node
type WebhookConfig struct {
	Method       string                 `json:"method"`
	Path         string                 `json:"path"`
	ResponseMode string                 `json:"responseMode,omitempty"`
	Options      map[string]interface{} `json:"options,omitempty"`
}

// Execution represents a workflow execution
type Execution struct {
	ID           string                 `json:"id"`
	WorkflowID   string                 `json:"workflowId"`
	Status       ExecutionStatus        `json:"status"`
	StartedAt    time.Time              `json:"startedAt"`
	FinishedAt   *time.Time             `json:"finishedAt,omitempty"`
	Mode         string                 `json:"mode,omitempty"`
	Data         map[string]interface{} `json:"data,omitempty"`
	Error        *ExecutionError        `json:"error,omitempty"`
	WaitTill     *time.Time             `json:"waitTill,omitempty"`
	Retries      int                    `json:"retries,omitempty"`
	CreatedAt    time.Time              `json:"createdAt"`
	UpdatedAt    time.Time              `json:"updatedAt"`
	DeletedAt    *time.Time             `json:"deletedAt,omitempty"`
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
	WorkflowData *Workflow              `json:"workflowData,omitempty"`
}

// ExecutionError represents an error during execution
type ExecutionError struct {
	Message    string                 `json:"message"`
	NodeName   string                 `json:"nodeName,omitempty"`
	NodeType   string                 `json:"nodeType,omitempty"`
	Timestamp  time.Time              `json:"timestamp"`
	Stack      string                 `json:"stack,omitempty"`
	Context    map[string]interface{} `json:"context,omitempty"`
	HTTPCode   int                    `json:"httpCode,omitempty"`
	HTTPMethod string                 `json:"httpMethod,omitempty"`
}

// ExecutionData represents data for a specific execution step
type ExecutionData struct {
	ExecutionID string                   `json:"executionId"`
	NodeName    string                   `json:"nodeName"`
	Data        []map[string]interface{} `json:"data"`
	StartTime   time.Time                `json:"startTime"`
	EndTime     *time.Time               `json:"endTime,omitempty"`
	Source      []SourceData             `json:"source,omitempty"`
}

// SourceData represents source data for execution
type SourceData struct {
	PreviousNode          string `json:"previousNode"`
	PreviousNodeOutput    int    `json:"previousNodeOutput,omitempty"`
	PreviousNodeRun       int    `json:"previousNodeRun,omitempty"`
	PreviousNodeParameter string `json:"previousNodeParameter,omitempty"`
}

// Credential represents stored credentials
type Credential struct {
	ID           string                 `json:"id"`
	Name         string                 `json:"name"`
	Type         string                 `json:"type"`
	Data         map[string]interface{} `json:"data"`
	NodesAccess  []CredentialAccess     `json:"nodesAccess,omitempty"`
	CreatedAt    time.Time              `json:"createdAt"`
	UpdatedAt    time.Time              `json:"updatedAt"`
	CreatedBy    string                 `json:"createdBy,omitempty"`
	UpdatedBy    string                 `json:"updatedBy,omitempty"`
	SharedWith   []string               `json:"sharedWith,omitempty"`
	TestStatus   string                 `json:"testStatus,omitempty"`
	TestError    string                 `json:"testError,omitempty"`
	TestedAt     *time.Time             `json:"testedAt,omitempty"`
}

// CredentialAccess represents access control for credentials
type CredentialAccess struct {
	NodeType string `json:"nodeType"`
	User     string `json:"user,omitempty"`
	Date     time.Time `json:"date,omitempty"`
}

// PaginationParams represents pagination parameters
type PaginationParams struct {
	Page     int `json:"page,omitempty"`
	PageSize int `json:"pageSize,omitempty"`
	SortBy   string `json:"sortBy,omitempty"`
	SortDir  string `json:"sortDir,omitempty"`
}

// PaginatedResponse represents a paginated API response
type PaginatedResponse[T any] struct {
	Data     []T  `json:"data"`
	Total    int  `json:"total"`
	Page     int  `json:"page"`
	PageSize int  `json:"pageSize"`
	HasMore  bool `json:"hasMore"`
}

// APIResponse represents a standard API response
type APIResponse[T any] struct {
	Success bool   `json:"success"`
	Data    T      `json:"data,omitempty"`
	Error   string `json:"error,omitempty"`
	Message string `json:"message,omitempty"`
}

// AuthToken represents authentication token information
type AuthToken struct {
	AccessToken  string     `json:"accessToken"`
	RefreshToken string     `json:"refreshToken,omitempty"`
	ExpiresAt    *time.Time `json:"expiresAt,omitempty"`
	TokenType    string     `json:"tokenType,omitempty"`
	Scope        string     `json:"scope,omitempty"`
}

// User represents user information
type User struct {
	ID       string `json:"id"`
	Email    string `json:"email"`
	Name     string `json:"name,omitempty"`
	Username string `json:"username,omitempty"`
	Role     string `json:"role,omitempty"`
	Active   bool   `json:"active"`
}

// WebSocketMessage represents a WebSocket message
type WebSocketMessage struct {
	Type        string      `json:"type"`
	ExecutionID string      `json:"executionId,omitempty"`
	NodeName    string      `json:"nodeName,omitempty"`
	Data        interface{} `json:"data,omitempty"`
	Timestamp   time.Time   `json:"timestamp"`
}

// ExecutionFilter represents filters for execution queries
type ExecutionFilter struct {
	WorkflowID *string          `json:"workflowId,omitempty"`
	Status     *ExecutionStatus `json:"status,omitempty"`
	StartDate  *time.Time       `json:"startDate,omitempty"`
	EndDate    *time.Time       `json:"endDate,omitempty"`
	Mode       *string          `json:"mode,omitempty"`
	Tags       []string         `json:"tags,omitempty"`
}

// WorkflowFilter represents filters for workflow queries
type WorkflowFilter struct {
	Active *bool    `json:"active,omitempty"`
	Status *WorkflowStatus `json:"status,omitempty"`
	Tags   []string `json:"tags,omitempty"`
	Search *string  `json:"search,omitempty"`
}

// NodeType represents a node type definition
type NodeType struct {
	Name               string         `json:"name"`
	DisplayName        string         `json:"displayName"`
	Description        string         `json:"description"`
	Version            float64        `json:"version"`
	Defaults           NodeDefaults   `json:"defaults"`
	Inputs             []string       `json:"inputs,omitempty"`
	Outputs            []string       `json:"outputs,omitempty"`
	OutputNames        []string       `json:"outputNames,omitempty"`
	Properties         []NodeProperty `json:"properties,omitempty"`
	Credentials        []CredentialRequirement `json:"credentials,omitempty"`
	MaxNodes           int            `json:"maxNodes,omitempty"`
	Subtitle           string         `json:"subtitle,omitempty"`
	Hidden             bool           `json:"hidden,omitempty"`
	Icon               string         `json:"icon,omitempty"`
	IconColor          string         `json:"iconColor,omitempty"`
	Group              []string       `json:"group,omitempty"`
	DocumentationURL   string         `json:"documentationUrl,omitempty"`
	Codex              NodeCodex      `json:"codex,omitempty"`
}

// NodeDefaults represents default values for a node
type NodeDefaults struct {
	Name  string `json:"name"`
	Color string `json:"color,omitempty"`
}

// CredentialRequirement represents credential requirements for a node
type CredentialRequirement struct {
	Name        string `json:"name"`
	Required    bool   `json:"required"`
	DisplayName string `json:"displayName,omitempty"`
	Type        string `json:"type,omitempty"`
}

// NodeCodex represents categorization information for a node
type NodeCodex struct {
	Categories    []string            `json:"categories,omitempty"`
	Subcategories map[string][]string `json:"subcategories,omitempty"`
	Resources     map[string][]string `json:"resources,omitempty"`
	Alias         []string            `json:"alias,omitempty"`
}

// ExecutionStatistics represents execution statistics
type ExecutionStatistics struct {
	Total        int                    `json:"total"`
	Running      int                    `json:"running"`
	Completed    int                    `json:"completed"`
	Failed       int                    `json:"failed"`
	Cancelled    int                    `json:"cancelled"`
	SuccessRate  float64                `json:"successRate"`
	FailureRate  float64                `json:"failureRate"`
	AvgDuration  time.Duration          `json:"avgDuration"`
	Trends       map[string]interface{} `json:"trends,omitempty"`
}

// WorkflowStatistics represents workflow statistics
type WorkflowStatistics struct {
	Total          int                    `json:"total"`
	Active         int                    `json:"active"`
	Inactive       int                    `json:"inactive"`
	WithErrors     int                    `json:"withErrors"`
	AvgNodes       float64                `json:"avgNodes"`
	AvgExecutions  float64                `json:"avgExecutions"`
	PopularNodes   []string               `json:"popularNodes,omitempty"`
	RecentActivity map[string]interface{} `json:"recentActivity,omitempty"`
}